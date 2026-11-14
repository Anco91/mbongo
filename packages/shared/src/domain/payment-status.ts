/**
 * Payment Display Status & Reconciliation Candidates
 *
 * Statut « dû » DÉRIVÉ à l'affichage (design M2 D4) : jamais stocké, aucune
 * transition à maintenir. États stockés inchangés : PENDING, PAID,
 * CANCELLED, FAILED.
 *
 * Fonctions pures, testables sans infrastructure.
 *
 * @packageDocumentation
 */

import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { Payment } from '../schemas/payment';
import { Transaction } from '../schemas/transaction';

// ============================================================================
// Statut d'affichage
// ============================================================================

/** Statut visible d'une échéance : le « dû » est dérivé, jamais stocké. */
export type PaymentDisplayStatus =
  | 'UPCOMING' // à venir : PENDING et échéance future
  | 'DUE' // dû : PENDING et échéance passée ou jour même
  | 'PAID'
  | 'CANCELLED'
  | 'FAILED';

/**
 * Statut visible d'une échéance à une date donnée.
 *
 * Le jour même compte comme « dû » (décision M2 figée) ; la comparaison se
 * fait sur le jour local des deux côtés, indépendamment de l'heure.
 *
 * @param payment - L'échéance évaluée
 * @param today - Date de référence (le jour local compte)
 */
export function paymentDisplayStatus(
  payment: Payment,
  today: Date
): PaymentDisplayStatus {
  if (payment.status !== 'PENDING') {
    return payment.status;
  }
  const dueDay = startOfDay(parseISO(payment.dueDate));
  const todayDay = startOfDay(today);
  return dueDay.getTime() <= todayDay.getTime() ? 'DUE' : 'UPCOMING';
}

/** true si l'échéance est « dû » (PENDING et échéance passée ou jour même). */
export function isDue(payment: Payment, today: Date): boolean {
  return paymentDisplayStatus(payment, today) === 'DUE';
}

// ============================================================================
// Candidats de rapprochement
// ============================================================================

/** Montant toléré entre l'échéance et la transaction candidate (± 0,01). */
export const RECONCILIATION_AMOUNT_TOLERANCE = 0.01;

/** Fenêtre de dates acceptée autour de l'échéance (± 7 jours). */
export const RECONCILIATION_DATE_WINDOW_DAYS = 7;

/**
 * Transactions candidates pour rapprocher une échéance.
 *
 * Filtre : montant à ± 0,01 de l'échéance, date dans une fenêtre de ± 7 jours
 * autour de la date d'échéance. Le tri est du ressort de l'appelant.
 *
 * Le filtrage PAR COMPTE est du ressort de l'appelant (l'UI ne propose que
 * des transactions du compte de la charge) : la base n'impose pas que la
 * transaction rapprochée soit du même compte (design M2 D4), seul l'UI filtre.
 *
 * @param payment - L'échéance à rapprocher
 * @param transactions - Transactions candidates (déjà filtrées par compte)
 */
export function reconciliationCandidates(
  payment: Payment,
  transactions: Transaction[]
): Transaction[] {
  const dueDate = parseISO(payment.dueDate);

  return transactions.filter((t) => {
    const amountMatch =
      Math.abs(Math.abs(t.amount) - payment.amount) <=
      RECONCILIATION_AMOUNT_TOLERANCE;
    const dayDistance = Math.abs(
      differenceInCalendarDays(parseISO(t.date), dueDate)
    );
    return amountMatch && dayDistance <= RECONCILIATION_DATE_WINDOW_DAYS;
  });
}
