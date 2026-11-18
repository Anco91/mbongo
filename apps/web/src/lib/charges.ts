/**
 * Charge presentation helpers — pure, no React (design D6).
 *
 * @module Lib/Charges
 */

import type { Charge, Payment } from '@mbongo/shared';

/** Charge list filter values, in display order. */
export const CHARGE_FILTERS = [
  'Toutes',
  'Fixes',
  'Échelonnées',
  'À venir',
] as const;

export type ChargeFilter = (typeof CHARGE_FILTERS)[number];

/**
 * Derived display status (no stored status on a charge):
 * provisioned → « Provisionnée » ; next payment due → « Dû » ;
 * future payment → « À venir » ; else « Payé ».
 */
export function chargeStatus(
  charge: Charge,
  nextPayment: Payment | null,
  now: Date = new Date()
): string {
  if (charge.provisioned) return 'Provisionnée';
  if (!nextPayment) return 'Payé';
  return nextPayment.dueDate <= now.toISOString() ? 'Dû' : 'À venir';
}

/**
 * Suffix appended to the formatted amount: ` / mois` for recurring charges,
 * ` × n` for installments, nothing otherwise. Shared by the row and the
 * detail sheet so the two never drift apart.
 */
export function chargeAmountLabel(charge: Charge): string {
  if (charge.type === 'FIXED_RECURRING' || charge.type === 'TEMPORARY') {
    return ' / mois';
  }
  if (charge.type === 'INSTALLMENT' && charge.installments) {
    return ` × ${charge.installments}`;
  }
  return '';
}
