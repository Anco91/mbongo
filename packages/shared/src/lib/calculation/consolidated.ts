/**
 * Consolidated Balance Calculation
 *
 * Calcule le patrimoine consolidé en EUR au dernier taux de conversion connu,
 * avec le total CHF natif en parallèle.
 *
 * @packageDocumentation
 */

import { Account } from '../../schemas/account';
import { Transfer } from '../../schemas/transfer';
import { counterValue } from '../../domain/conversion';

export interface ConsolidatedBalance {
  totalEur: number | null;
  totalChf: number;
  rate: number | null;
  rateDate: string | null;
  isAvailable: boolean;
}

/** Taux courant de consolidation : CHF → EUR (ex. 0.9231), daté et sourcé. */
export interface ResolvedRate {
  rate: number;
  rateDate: string;
  source: 'live' | 'fallback';
}

/**
 * Fusionne le taux live (officiel, ex. Frankfurter/BCE) avec le dernier taux
 * connu des transferts. Convention identique à `counterValue` : le taux
 * convertit CHF → EUR. Live prioritaire ; fallback si live absent ou invalide
 * (≤ 0). `null` quand rien n'est disponible — aucun taux fictif.
 *
 * @param live - Taux officiel du jour (déjà converti en CHF → EUR), ou null
 * @param fallbackTransfers - Historique des transferts pour le fallback
 */
export function resolveRate(
  live: { rate: number; rateDate: string } | null | undefined,
  fallbackTransfers: Transfer[]
): ResolvedRate | null {
  if (live && live.rate > 0) {
    return { rate: live.rate, rateDate: live.rateDate, source: 'live' };
  }
  const fallback = findLatestRate(fallbackTransfers);
  if (fallback) {
    return {
      rate: fallback.rate,
      rateDate: fallback.rateDate,
      source: 'fallback',
    };
  }
  return null;
}

/**
 * Arrondit un nombre à 2 décimales.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Trouve le dernier taux connu à partir des transferts :
 * 1. Taux effectif du dernier transfert COMPLETED
 * 2. Sinon taux estimé du dernier transfert
 */
export function findLatestRate(
  transfers: Transfer[]
): { rate: number; rateDate: string } | null {
  if (transfers.length === 0) return null;

  // 1. Chercher d'abord les transferts complétés avec taux effectif
  const completed = transfers
    .filter((t) => t.status === 'COMPLETED' && t.rateEffective !== null)
    .sort((a, b) => {
      const dateA = a.receivedAt
        ? new Date(a.receivedAt).getTime()
        : new Date(a.rateDate).getTime();
      const dateB = b.receivedAt
        ? new Date(b.receivedAt).getTime()
        : new Date(b.rateDate).getTime();
      return dateB - dateA;
    });

  if (completed.length > 0 && completed[0].rateEffective !== null) {
    const latest = completed[0];
    return {
      rate: latest.rateEffective as number,
      rateDate: latest.receivedAt ?? latest.rateDate,
    };
  }

  // 2. Sinon, chercher le dernier taux estimé
  const estimated = [...transfers].sort(
    (a, b) => new Date(b.rateDate).getTime() - new Date(a.rateDate).getTime()
  );

  if (estimated.length > 0 && estimated[0].rateEstimated > 0) {
    return {
      rate: estimated[0].rateEstimated,
      rateDate: estimated[0].rateDate,
    };
  }

  return null;
}

/**
 * Calcule le patrimoine consolidé pour un ensemble de comptes et de soldes.
 *
 * @param accounts - Comptes du foyer
 * @param balances - Map des soldes actuels par id de compte (solde calculé)
 * @param transfers - Historique des transferts pour extraire le dernier taux
 * @param rateOverride - Taux courant officiel (live) prioritaire sur le
 *   fallback transferts ; absent → fallback (comportement inchangé)
 */
export function computeConsolidatedBalance(
  accounts: Account[],
  balances: Record<string, number>,
  transfers: Transfer[],
  rateOverride?: { rate: number; rateDate: string } | null
): ConsolidatedBalance {
  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');

  let totalChf = 0;
  let totalEurNative = 0;

  for (const account of activeAccounts) {
    const balance = balances[account.id] ?? account.openingBalance ?? 0;
    if (account.currency === 'CHF') {
      totalChf += balance;
    } else {
      totalEurNative += balance;
    }
  }

  totalChf = round2(totalChf);
  totalEurNative = round2(totalEurNative);

  const rateInfo =
    rateOverride && rateOverride.rate > 0
      ? rateOverride
      : findLatestRate(transfers);

  if (!rateInfo) {
    return {
      totalEur: null,
      totalChf,
      rate: null,
      rateDate: null,
      isAvailable: false,
    };
  }

  const chfInEur = counterValue(totalChf, rateInfo.rate);
  const totalEur = round2(totalEurNative + chfInEur);

  return {
    totalEur,
    totalChf,
    rate: rateInfo.rate,
    rateDate: rateInfo.rateDate,
    isAvailable: true,
  };
}

/** Un terme du patrimoine : le solde d'un compte actif, en devise native. */
export interface NetWorthTerm {
  accountId: string;
  name: string;
  currency: Account['currency'];
  /** Solde signé, arrondi à 2 décimales, jamais 0. */
  balance: number;
  kind: 'asset' | 'overdraft';
}

/**
 * Liste les termes du patrimoine consolidé : un par compte actif au solde non nul.
 * Même règle de solde que `computeConsolidatedBalance`.
 *
 * @param accounts - Comptes du foyer
 * @param balances - Map des soldes actuels par id de compte
 */
export function listNetWorthTerms(
  accounts: Account[],
  balances: Record<string, number>
): NetWorthTerm[] {
  throw new Error('not implemented');
}
