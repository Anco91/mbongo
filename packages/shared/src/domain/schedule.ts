/**
 * Schedule Domain Logic
 *
 * Logique métier pure pour la génération des paiements planifiés.
 * Ces fonctions sont TESTABLES sans serveur et sans base de données.
 *
 * @packageDocumentation
 */

import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  compareAsc,
  endOfMonth,
  getDaysInMonth,
  isAfter,
  isBefore,
  parseISO,
  setDate,
  startOfMonth,
} from 'date-fns';
import { Charge } from '../schemas/charge';
import { CreatePaymentInput, Payment } from '../schemas/payment';

// ============================================================================
// Types
// ============================================================================

/** Type pour les fréquences */
type Frequency = NonNullable<Charge['frequency']>;

/** Map des fonctions d'incrémentation par fréquence */
const steps: Record<Frequency, (d: Date, n: number) => Date> = {
  daily: addDays,
  weekly: addWeeks,
  monthly: addMonths,
  yearly: addYears,
};

// ============================================================================
// Fonction Principale
// ============================================================================

/**
 * Génère les paiements planifiés pour une charge.
 *
 * Cette fonction est PURE: elle ne dépend d'aucune infrastructure.
 * Elle peut être testée sans base de données et réutilisée partout.
 *
 * @param charge - La charge pour laquelle générer les paiements
 * @param from - Date de référence pour l'horizon du calendrier
 * @returns Données à créer via le CRUD Payment
 *
 * @example
 * ```typescript
 * const charge: Charge = {
 *   id: "123",
 *   label: "Loyer",
 *   type: "FIXED_RECURRING",
 *   amount: 1000,
 *   currency: "CHF",
 *   accountId: "456",
 *   category: "rent",
 *   startDate: "2024-01-01",
 *   endDate: "2024-12-31",
 *   frequency: "monthly",
 *   installments: null,
 *   provisioned: false,
 *   createdAt: "2024-01-01",
 *   updatedAt: "2024-01-01",
 * };
 *
 * const payments = generatePayments(charge, parseISO("2024-01-01"));
 * // Génère 12 paiements mensuels
 * ```
 */
export function generatePayments(
  charge: Charge,
  from: Date
): CreatePaymentInput[] {
  const startDate = parseISO(charge.startDate);
  const endDate = charge.endDate ? parseISO(charge.endDate) : null;

  switch (charge.type) {
    case 'FIXED_RECURRING': {
      if (!charge.frequency) {
        throw new Error('FIXED_RECURRING charges require a frequency');
      }
      return generateRecurringPayments(
        charge,
        startDate,
        endDate,
        from,
        charge.frequency
      );
    }

    case 'INSTALLMENT': {
      if (!charge.installments) {
        throw new Error('INSTALLMENT charges require an installment count');
      }
      return generateInstallmentPayments(
        charge,
        startDate,
        charge.installments
      );
    }

    case 'TEMPORARY': {
      if (!charge.frequency || !charge.endDate) {
        throw new Error('TEMPORARY charges require frequency and endDate');
      }
      return generateRecurringPayments(
        charge,
        startDate,
        endDate,
        from,
        charge.frequency
      );
    }

    case 'ONE_OFF': {
      return [makePayment(charge, startDate, charge.amount)];
    }

    case 'UPCOMING': {
      // Provisioned charges are billed at a known future date
      // We generate one payment at the start date
      return [makePayment(charge, startDate, charge.amount)];
    }

    default: {
      const unexpectedType = (charge as { type: string }).type;
      throw new Error(`Unknown charge type: ${unexpectedType}`);
    }
  }
}

// ============================================================================
// Générateurs Spécifiques
// ============================================================================

/**
 * Génère les paiements pour une charge récurrente (FIXED_RECURRING ou TEMPORARY)
 */
function generateRecurringPayments(
  charge: Charge,
  startDate: Date,
  endDate: Date | null,
  from: Date,
  frequency: Frequency
): CreatePaymentInput[] {
  if (frequency === 'monthly') {
    return generateMonthlyPayments(charge, startDate, endDate, from);
  }

  const payments: CreatePaymentInput[] = [];
  let due = startDate;

  // Default horizon: 5 years from now if no end date
  const horizon = endDate ?? addYears(from, 5);

  while (isBefore(due, from)) {
    due = steps[frequency](due, 1);
  }

  while (!isAfter(due, horizon)) {
    payments.push(makePayment(charge, due, charge.amount));
    due = steps[frequency](due, 1);
  }

  return payments;
}

/**
 * Génère les paiements d'une récurrence mensuelle (design D4).
 *
 * La récurrence est ancrée sur le jour de prélèvement choisi
 * (`charge.dueDay`), à défaut sur le jour de la date de début (legacy).
 * Le mois d'ancrage — celui de `startDate`, ou le mois courant si
 * `startDate` lui est antérieur — est TOUJOURS généré, même si le jour
 * est déjà passé : le statut « dû » en est dérivé (aucune boucle de saut,
 * changement de comportement assumé par le change). Le jour est clampé à
 * la longueur du mois (le 31 tombe le 28/29 en février).
 */
function generateMonthlyPayments(
  charge: Charge,
  startDate: Date,
  endDate: Date | null,
  from: Date
): CreatePaymentInput[] {
  const payments: CreatePaymentInput[] = [];
  const day = charge.dueDay ?? startDate.getDate();
  const anchorMonth = startOfMonth(isAfter(startDate, from) ? startDate : from);
  const horizon = endDate ?? addYears(from, 5);

  let month = anchorMonth;
  let guard = 0;
  while (guard < 12 * 6) {
    const due = resolveDueDay(month, day);
    if (isAfter(due, horizon)) break;
    payments.push(makePayment(charge, due, charge.amount));
    month = addMonths(month, 1);
    guard += 1;
  }

  return payments;
}

/**
 * Génère les paiements pour une charge en plusieurs versements (INSTALLMENT)
 */
function generateInstallmentPayments(
  charge: Charge,
  startDate: Date,
  installments: number
): CreatePaymentInput[] {
  const amountPerInstallment = charge.amount / installments;

  return Array.from({ length: installments }, (_, i) => {
    const dueDate = addMonths(startDate, i);
    return makePayment(charge, dueDate, amountPerInstallment);
  });
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Adapt le jour de prélèvement à la longueur du mois : le 31 tombe le 28
 * (ou le 29 en année bissextile) en février, le 30 en avril…
 *
 * @param month - Date représentant le mois cible
 * @param day - Jour choisi (1–31)
 * @returns Date locale au jour clampé du mois
 */
export function resolveDueDay(month: Date, day: number): Date {
  const monthStart = startOfMonth(month);
  const clamped = Math.min(
    Math.max(Math.trunc(day), 1),
    getDaysInMonth(monthStart)
  );
  return setDate(monthStart, clamped);
}

/**
 * Crée un paiement planifié
 */
function makePayment(
  charge: Charge,
  dueDate: Date,
  amount: number = charge.amount
): CreatePaymentInput {
  const year = dueDate.getFullYear();
  const month = String(dueDate.getMonth() + 1).padStart(2, '0');
  const day = String(dueDate.getDate()).padStart(2, '0');
  const utcIso = `${year}-${month}-${day}T00:00:00.000Z`;

  return {
    chargeId: charge.id,
    amount: round2(amount),
    currency: charge.currency,
    dueDate: utcIso,
    status: 'PENDING',
  };
}

/**
 * Arrondir à 2 décimales (pour les montants financiers)
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ============================================================================
// Fonctions de Calcul
// ============================================================================

/**
 * Calcule la provision mensuelle pour les charges provisionnées.
 *
 * Exemple: SERAFE 335 CHF → 27.92 CHF/month
 *
 * @param charges - Liste des charges
 * @returns Provision mensuelle totale
 *
 * @example
 * ```typescript
 * const charges: Charge[] = [
 *   { id: "1", amount: 335, provisioned: true, ... },
 *   { id: "2", amount: 200, provisioned: false, ... },
 * ];
 *
 * const monthly = monthlyProvision(charges);
 * // 335 / 12 = 27.916... ≈ 27.92
 * ```
 */
export function monthlyProvision(charges: Charge[]): number {
  const provisionedCharges = charges.filter((c) => c.provisioned);
  const total = provisionedCharges.reduce((sum, c) => sum + c.amount, 0);
  return round2(total / 12);
}

/**
 * Retourne les échéances d'une charge pas encore persistées.
 *
 * Compare le calendrier attendu (généré) aux échéances existantes
 * par instant de `dueDate`, indépendamment du format de sérialisation ISO.
 * Sert à reprendre une création groupée interrompue sans dupliquer les échéances.
 *
 * @param charge - La charge concernée
 * @param existing - Échéances déjà persistées pour cette charge
 * @param from - Date de référence pour l'horizon du calendrier
 * @returns Échéances manquantes à créer via le CRUD Payment
 *
 * @example
 * ```typescript
 * const existing: Payment[] = [firstInstallment]; // déjà créé
 * const missing = missingPayments(charge, existing, new Date());
 * // Retourne les versements restants uniquement
 * ```
 */
export function missingPayments(
  charge: Charge,
  existing: Payment[],
  from: Date
): CreatePaymentInput[] {
  const persistedDueDates = new Set(
    existing.map((payment) => new Date(payment.dueDate).getTime())
  );

  return generatePayments(charge, from).filter(
    (payment) => !persistedDueDates.has(new Date(payment.dueDate).getTime())
  );
}

/**
 * Calcule le solde restant d'une charge en plusieurs versements.
 *
 * @param charge - La charge
 * @param payments - Liste des paiements déjà effectués
 * @returns Solde restant
 *
 * @example
 * ```typescript
 * const charge: Charge = { id: "1", amount: 1200, ... };
 * const payments: Payment[] = [
 *   { id: "1", amount: 400, status: "PAID", ... },
 *   { id: "2", amount: 400, status: "PAID", ... },
 * ];
 *
 * const remaining = remainingBalance(charge, payments);
 * // 1200 - (400 + 400) = 400
 * ```
 */
export function remainingBalance(charge: Charge, payments: Payment[]): number {
  const paid = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  return round2(charge.amount - paid);
}

/**
 * Filtre les paiements visibles dans un mois donné.
 *
 * @param payments - Liste des paiements
 * @param month - Date représentant le mois (ex: new Date(2024, 0) pour Janvier 2024)
 * @returns Paiements du mois
 *
 * @example
 * ```typescript
 * const payments: Payment[] = [
 *   { dueDate: "2024-01-15", ... },
 *   { dueDate: "2024-02-01", ... },
 * ];
 *
 * const januaryPayments = paymentsInMonth(payments, new Date(2024, 0));
 * // Retourne seulement le paiement du 15 janvier
 * ```
 */
export function paymentsInMonth(payments: Payment[], month: Date): Payment[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  return payments.filter((p) => {
    const dueDate = parseISO(p.dueDate);
    return dueDate >= monthStart && dueDate <= monthEnd;
  });
}

/**
 * Calcule le total des paiements pour un mois donné.
 *
 * @param payments - Liste des paiements
 * @param month - Date représentant le mois
 * @returns Total des montants
 */
export function monthlyPaymentTotal(payments: Payment[], month: Date): number {
  const monthlyPayments = paymentsInMonth(payments, month);
  return round2(monthlyPayments.reduce((sum, p) => sum + p.amount, 0));
}

/**
 * Trouve le prochain paiement à effectuer.
 *
 * @param payments - Liste des paiements
 * @param from - Date de référence (défaut: aujourd'hui)
 * @returns Prochain paiement ou null
 */
export function nextPayment(payments: Payment[], from: Date): Payment | null {
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');

  if (pendingPayments.length === 0) return null;

  // Trier par date
  pendingPayments.sort((a, b) => {
    const dateA = parseISO(a.dueDate);
    const dateB = parseISO(b.dueDate);
    return compareAsc(dateA, dateB);
  });

  // Trouver le premier paiement après la date de référence
  for (const payment of pendingPayments) {
    const dueDate = parseISO(payment.dueDate);
    if (!isBefore(dueDate, from)) {
      return payment;
    }
  }

  return null;
}

/**
 * Vérifie si un paiement est en retard.
 *
 * @param payment - Paiement à vérifier
 * @param asOf - Date de référence (défaut: aujourd'hui)
 * @returns true si en retard
 */
export function isOverdue(payment: Payment, asOf: Date): boolean {
  const dueDate = parseISO(payment.dueDate);
  return payment.status === 'PENDING' && isBefore(dueDate, asOf);
}

/**
 * Calcule les paiements en retard.
 *
 * @param payments - Liste des paiements
 * @param asOf - Date de référence
 * @returns Paiements en retard
 */
export function overduePayments(payments: Payment[], asOf: Date): Payment[] {
  return payments.filter((p) => isOverdue(p, asOf));
}

/**
 * Vérifie si une charge est expirée pour un mois donné.
 *
 * Une charge est expirée si sa date de fin est strictement avant la fin du mois
 * de référence. Les charges sans date de fin ne sont jamais expirées.
 *
 * @param charge - La charge à vérifier
 * @param monthDate - Date représentant le mois (ex: premier jour du mois)
 * @returns true si la charge est expirée pour ce mois
 *
 * @example
 * ```typescript
 * const charge: Charge = { endDate: "2024-06-15", ... };
 * const monthDate = new Date(2024, 6, 1); // Juillet 2024
 * isChargeExpiredForMonth(charge, monthDate); // true (fin juin < fin juillet)
 * ```
 */
export function isChargeExpiredForMonth(
  charge: Charge,
  monthDate: Date
): boolean {
  if (!charge.endDate) return false;
  const endDate = parseISO(charge.endDate);
  const monthEnd = endOfMonth(monthDate);
  return endDate < monthEnd;
}

/**
 * Convertisseur de devise optionnel pour computeMonthlyBudget.
 */
export type CurrencyConverter = (amount: number, currency: string) => number;

/**
 * Calcule le budget mensuel avec la règle anti-double comptage des provisions :
 * Les charges provisionnées comptent via leur provision mensuelle (somme / 12)
 * et leurs échéances réelles du mois sont exclues.
 *
 * @param charges - Liste des charges
 * @param payments - Liste des paiements
 * @param month - Mois concerné
 * @param convert - Convertisseur de devise optionnel
 */
export function computeMonthlyBudget(
  charges: Charge[],
  payments: Payment[],
  month: Date,
  convert?: CurrencyConverter
): {
  total: number;
  paymentsTotal: number;
  provisionsTotal: number;
  regularPayments: Payment[];
} {
  const provisionedChargeIds = new Set(
    charges.filter((c) => c.provisioned).map((c) => c.id)
  );

  const monthPayments = paymentsInMonth(payments, month);
  const regularPayments = monthPayments.filter(
    (p) => !provisionedChargeIds.has(p.chargeId)
  );

  const paymentsTotal = round2(
    regularPayments.reduce((sum, p) => {
      const amount = convert ? convert(p.amount, p.currency) : p.amount;
      return sum + amount;
    }, 0)
  );
  const provisionsTotal = monthlyProvision(charges);
  const total = round2(paymentsTotal + provisionsTotal);

  return {
    total,
    paymentsTotal,
    provisionsTotal,
    regularPayments,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { steps, round2 };
