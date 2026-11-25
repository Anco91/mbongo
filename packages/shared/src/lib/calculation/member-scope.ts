/**
 * scopeToMember — restricts chart inputs to the accounts of one household
 * member (and what points at them). `null` keeps the whole household.
 * Pure, no mutation; same shape as `excludeClosedAccounts`.
 *
 * @module Shared/Calculation/MemberScope
 */
import type { AccountScopedData } from './active-accounts';

export function scopeToMember(
  input: AccountScopedData,
  memberId: string | null,
  accountId: string | null = null
): AccountScopedData {
  void accountId;
  if (memberId === null) return input;
  const accounts = input.accounts.filter((a) => a.memberId === memberId);
  const ids = new Set(accounts.map((a) => a.id));
  const chargeIds = new Set(
    input.charges.filter((c) => ids.has(c.accountId)).map((c) => c.id)
  );
  return {
    accounts,
    transactions: input.transactions.filter((t) => ids.has(t.accountId)),
    transfers: input.transfers.filter(
      (t) => ids.has(t.sourceAccountId) && ids.has(t.targetAccountId)
    ),
    charges: input.charges.filter((c) => chargeIds.has(c.id)),
    payments: input.payments.filter((p) => chargeIds.has(p.chargeId)),
    ...(input.incomes
      ? { incomes: input.incomes.filter((i) => ids.has(i.accountId)) }
      : {}),
  };
}
