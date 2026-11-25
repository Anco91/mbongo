/**
 * excludeClosedAccounts — drops closed accounts and everything pointing at
 * them (transactions, charges, payments of those charges, transfers touching
 * one) so the dashboard charts can hide them. Pure, no mutation.
 *
 * @module Shared/Calculation/ActiveAccounts
 */
import type { Account } from '../../schemas/account';
import type { Transaction } from '../../schemas/transaction';
import type { Transfer } from '../../schemas/transfer';
import type { Charge } from '../../schemas/charge';
import type { Payment } from '../../schemas/payment';
import type { Income } from '../../schemas/income';

export interface AccountScopedData {
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  charges: Charge[];
  payments: Payment[];
  incomes?: Income[];
}

export function excludeClosedAccounts(
  input: AccountScopedData
): AccountScopedData {
  const closedIds = new Set(
    input.accounts.filter((a) => a.status === 'CLOSED').map((a) => a.id)
  );
  const droppedChargeIds = new Set(
    input.charges.filter((c) => closedIds.has(c.accountId)).map((c) => c.id)
  );
  return {
    accounts: input.accounts.filter((a) => !closedIds.has(a.id)),
    transactions: input.transactions.filter((t) => !closedIds.has(t.accountId)),
    transfers: input.transfers.filter(
      (t) =>
        !closedIds.has(t.sourceAccountId) &&
        (t.targetAccountId === null || !closedIds.has(t.targetAccountId))
    ),
    charges: input.charges.filter((c) => !droppedChargeIds.has(c.id)),
    payments: input.payments.filter((p) => !droppedChargeIds.has(p.chargeId)),
    ...(input.incomes
      ? { incomes: input.incomes.filter((i) => !closedIds.has(i.accountId)) }
      : {}),
  };
}
