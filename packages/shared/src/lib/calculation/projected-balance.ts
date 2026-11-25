/**
 * Projected balance: household balances at the end of a month, real for a
 * past month, real-to-date plus expected flows for the current or a future one.
 *
 * ADVISOR STUB (spec 38): types and signatures only, the Executor implements.
 *
 * @packageDocumentation
 */
import type { Account } from '../../schemas/account';
import type { Charge } from '../../schemas/charge';
import type { Income } from '../../schemas/income';
import type { Payment } from '../../schemas/payment';
import type { Transaction } from '../../schemas/transaction';
import type { Transfer } from '../../schemas/transfer';

export type MonthState = 'past' | 'current' | 'future';

export interface ProjectionInput {
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  payments: Payment[];
  charges: Charge[];
  incomes: Income[];
  today: Date;
  /** Target month, `YYYY-MM`. */
  monthKey: string;
  /** CHF → EUR rate, or null when unknown. */
  rate: number | null;
}

export interface ProjectedBalance {
  state: MonthState;
  /** ACTIVE accounts only, native currency, at the end of `monthKey`. */
  balances: Record<string, number>;
  /** Consolidated EUR; null without a rate. */
  totalEur: number | null;
}

/** `past`, `current` or `future` compared with the UTC month of `today`. */
export function computeMonthState(monthKey: string, today: Date): MonthState {
  void monthKey;
  void today;
  throw new Error('computeMonthState: not implemented (spec 38)');
}

export function computeProjectedBalance(
  input: ProjectionInput
): ProjectedBalance {
  void input;
  throw new Error('computeProjectedBalance: not implemented (spec 38)');
}
