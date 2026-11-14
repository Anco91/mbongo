/**
 * Deferred Card & Credit Card Billing Domain Logic
 *
 * Mécanisme unifié « une seule implémentation, deux habillages » (cdc § 2.3.4) :
 * - carte de crédit (UBS) : compte carte distinct, facturation mensuelle au
 *   jour de facturation, prélèvement sur le compte courant lié ;
 * - carte à débit différé (BNP) : le compte est la carte, cycle = mois
 *   civil, règlement = le compte lui-même en fin de mois.
 *
 * L'encours et l'échéance de facturation sont CALCULÉS à la volée et jamais
 * persistés (voir design M2 D1). Le débit réel reste une transaction
 * ordinaire : l'app ne génère jamais de transaction de règlement.
 *
 * Toutes les fonctions sont pures et testables sans infrastructure.
 *
 * @packageDocumentation
 */

import { addDays, endOfMonth, isAfter, parseISO, setDate, startOfDay, startOfMonth } from 'date-fns';
import { Account } from '../schemas/account';
import { Transaction } from '../schemas/transaction';

// ============================================================================
// Types
// ============================================================================

/**
 * État de facturation d'un compte carte à un instant t.
 *
 * `encours` est toujours positif ou nul : c'est le montant qui partira sur le
 * compte de règlement à la prochaine facturation. Aucune échéance ne doit
 * être affichée lorsque `encours` vaut 0.
 */
export interface CardBilling {
  /** Montant du cycle en cours (positif, arrondi à 2 décimales). */
  encours: number;
  /** Prochaine date de facturation (null si indéterminable). */
  nextBillingDate: Date | null;
  /** Compte sur lequel le règlement part. */
  settlementAccountId: string;
}

// ============================================================================
// Fonction Principale
// ============================================================================

/**
 * Calcule l'encours et la prochaine échéance de facturation d'un compte carte.
 *
 * Règles de cycle :
 * - débit différé (`deferredCard`) : cycle = mois civil de `today` ; le
 *   prélèvement groupé de fin de mois ne se saisit jamais comme transaction
 *   (convention anti-double-compte), donc les achats du mois SONT le cycle.
 * - carte de crédit : le cycle démarre après la dernière transaction de
 *   règlement (montant positif) enregistrée sur le compte carte.
 *
 * Les transactions passées en paramètre doivent être celles du compte carte
 * lui-même ; le filtrage par compte est du ressort de l'appelant.
 *
 * @param account - Le compte carte (CREDIT_CARD ou compte à débit différé)
 * @param transactions - Toutes les transactions du compte carte
 * @param today - Date de référence
 *
 * @example
 * ```typescript
 * const billing = cardBilling(carteUbs, transactionsUbs, new Date());
 * // { encours: 640.2, nextBillingDate: Date(28/11), settlementAccountId: "ubs-courant" }
 * ```
 */
export function cardBilling(
  account: Account,
  transactions: Transaction[],
  today: Date
): CardBilling {
  return account.deferredCard
    ? deferredCardBilling(account, transactions, today)
    : creditCardBilling(account, transactions, today);
}

// ============================================================================
// Habillage 1 — Carte à débit différé (BNP) : cycle = mois civil
// ============================================================================

function deferredCardBilling(
  account: Account,
  transactions: Transaction[],
  today: Date
): CardBilling {
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const cycleAmounts = transactions
    .filter((t) => {
      const date = parseISO(t.date);
      return date >= monthStart && date <= monthEnd;
    })
    .map((t) => t.amount);

  return {
    encours: round2(-cycleAmounts.reduce((sum, amount) => sum + amount, 0)),
    nextBillingDate: monthEnd,
    settlementAccountId: account.id,
  };
}

// ============================================================================
// Habillage 2 — Carte de crédit (UBS) : cycle depuis le dernier règlement
// ============================================================================

function creditCardBilling(
  account: Account,
  transactions: Transaction[],
  today: Date
): CardBilling {
  // Cycle boundary : dernière transaction de règlement (crédit) sur la carte.
  // Un avoir isolé entre deux règlements ferme le cycle — cas rare, corrigé
  // par un snapshot de solde.
  let boundary: Date | null = null;
  for (const t of sortedByDate(transactions)) {
    if (t.amount > 0) {
      boundary = parseISO(t.date);
    }
  }

  const cycleAmounts = transactions
    .filter((t) => {
      const date = parseISO(t.date);
      return boundary === null || isAfter(date, boundary);
    })
    .map((t) => t.amount);

  return {
    encours: round2(-cycleAmounts.reduce((sum, amount) => sum + amount, 0)),
    nextBillingDate: account.billingDay
      ? nextBillingDayOccurrence(account.billingDay, today)
      : null,
    settlementAccountId: account.linkedAccountId ?? account.id,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/** Trie une copie des transactions par date croissante. */
function sortedByDate(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
  );
}

/**
 * Prochaine occurrence du jour de facturation, à partir de `today` inclus.
 * Le jour est borné à la longueur du mois (31 → 30/28).
 */
function nextBillingDayOccurrence(billingDay: number, today: Date): Date {
  const daysInMonth = endOfMonth(today).getDate();
  const day = Math.min(billingDay, daysInMonth);
  const candidate = setDate(today, day);
  if (isAfter(candidate, today)) {
    // Normalise à minuit : la date de facturation est une date, pas un instant.
    return startOfDay(candidate);
  }
  // Repart du premier jour du mois suivant : garantir la terminaison même
  // lorsque le jour de facturation reste <= au jour courant.
  return nextBillingDayOccurrence(billingDay, addDays(endOfMonth(today), 1));
}

/** Arrondir à 2 décimales (montants financiers), sans -0. */
function round2(n: number): number {
  return Math.round(n * 100) / 100 || 0;
}

// ============================================================================
// Exports
// ============================================================================

export { round2 as roundBillingAmount };
