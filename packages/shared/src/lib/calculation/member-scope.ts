/**
 * scopeToMember — restricts chart inputs to one household member: their
 * accounts (and what points at them) and the charges they own
 * (`chargeOwner`). `null` keeps the whole household. With an `accountId` of
 * that member, everything narrows to that account. Pure, no mutation; same
 * shape as `excludeClosedAccounts`.
 *
 * @module Shared/Calculation/MemberScope
 */
import type { AccountScopedData } from './active-accounts';
import { chargeOwner } from '../../domain/charge-owner';

export function scopeToMember(
  input: AccountScopedData,
  memberId: string | null,
  accountId: string | null = null
): AccountScopedData {
  if (memberId === null) return input;
  const accounts = input.accounts.filter(
    (a) => a.memberId === memberId && (accountId === null || a.id === accountId)
  );
  const ids = new Set(accounts.map((a) => a.id));
  const accountById = new Map(input.accounts.map((a) => [a.id, a]));
  const charges = input.charges.filter(
    (c) =>
      chargeOwner(c, accountById.get(c.accountId)) === memberId &&
      (accountId === null || c.accountId === accountId) &&
      (accountId === null || ids.has(accountId))
  );
  const chargeIds = new Set(charges.map((c) => c.id));
  return {
    accounts,
    transactions: input.transactions.filter((t) => ids.has(t.accountId)),
    transfers: input.transfers.filter(
      (t) =>
        ids.has(t.sourceAccountId) &&
        (t.targetAccountId === null || ids.has(t.targetAccountId))
    ),
    charges,
    payments: input.payments.filter((p) => chargeIds.has(p.chargeId)),
    ...(input.incomes
      ? { incomes: input.incomes.filter((i) => ids.has(i.accountId)) }
      : {}),
  };
}
