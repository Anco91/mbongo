/**
 * Filter and index helpers — pure, no React (design D6). Shared by the
 * charges, accounts and dashboard views so each map is built the same way.
 *
 * @module Lib/Filters
 */

import type { Account, Charge, Payment } from '@mbongo/shared';
import type { ChargeFilter } from '@/lib/charges';

/** True when a member id passes the member filter (`all` matches everything). */
export function matchesMemberFilter(
  memberId: string | null | undefined,
  selected: string
): boolean {
  return selected === 'all' || memberId === selected;
}

/** Index accounts by id. */
export function buildAccountsMap(accounts: Account[]): Map<string, Account> {
  return new Map(accounts.map((account) => [account.id, account]));
}

/** Index charges by id. */
export function buildChargesMap(charges: Charge[]): Map<string, Charge> {
  return new Map(charges.map((charge) => [charge.id, charge]));
}

/** Group payments by charge, each group sorted by due date ascending. */
export function groupPaymentsByCharge(
  payments: Payment[]
): Map<string, Payment[]> {
  const map = new Map<string, Payment[]>();
  for (const payment of payments) {
    const list = map.get(payment.chargeId) ?? [];
    list.push(payment);
    map.set(payment.chargeId, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }
  return map;
}

/** First pending payment per charge (earliest due date). */
export function nextPendingByCharge(payments: Payment[]): Map<string, Payment> {
  const map = new Map<string, Payment>();
  for (const payment of payments) {
    if (payment.status !== 'PENDING') continue;
    const existing = map.get(payment.chargeId);
    if (!existing || payment.dueDate < existing.dueDate) {
      map.set(payment.chargeId, payment);
    }
  }
  return map;
}

/** Apply the member and type filters to a charge list. */
export function filterCharges(
  charges: Charge[],
  accountsById: Map<string, Account>,
  filter: ChargeFilter,
  selectedMember: string
): Charge[] {
  return charges.filter((charge) => {
    const account = accountsById.get(charge.accountId);
    if (!matchesMemberFilter(account?.memberId, selectedMember)) return false;
    if (filter === 'Toutes') return true;
    if (filter === 'Fixes') return charge.type === 'FIXED_RECURRING';
    if (filter === 'Échelonnées') return charge.type === 'INSTALLMENT';
    return (
      charge.type === 'UPCOMING' ||
      charge.type === 'TEMPORARY' ||
      charge.provisioned
    );
  });
}
