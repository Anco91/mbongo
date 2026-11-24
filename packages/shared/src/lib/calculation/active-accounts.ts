/**
 * excludeClosedAccounts — stub for 06-closed-accounts-in-charts.
 * Replaced by the Executor; the locked test pins the behaviour.
 *
 * @module Shared/Calculation/ActiveAccounts
 */
import type { Account } from '../../schemas/account';
import type { Transaction } from '../../schemas/transaction';
import type { Transfer } from '../../schemas/transfer';
import type { Charge } from '../../schemas/charge';
import type { Payment } from '../../schemas/payment';

export interface AccountScopedData {
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  charges: Charge[];
  payments: Payment[];
}

export function excludeClosedAccounts(
  input: AccountScopedData
): AccountScopedData {
  void input;
  throw new Error('not implemented');
}
