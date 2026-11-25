/**
 * Month journey: what a month holds when it is prepared at its start, and the
 * logical start balance of each account. Advisor stub (spec 39): the Executor
 * replaces the bodies and keeps the exported types and signatures.
 *
 * @packageDocumentation
 */
import type { CurrencyConverter } from '../../domain/schedule';
import type { ConfirmedIncomeEntry } from '../../domain/income';
import type { Account } from '../../schemas/account';
import type { Charge } from '../../schemas/charge';
import type { Income } from '../../schemas/income';
import type { Payment } from '../../schemas/payment';

/** Balance per account id, native currency. */
export type AccountBalances = Record<string, number>;

export interface MonthPlanInput {
  /** Target month, `YYYY-MM`. */
  monthKey: string;
  accounts: Account[];
  charges: Charge[];
  /** Persisted payments, any month, any status. */
  payments: Payment[];
  incomes: Income[];
  confirmedIncome: ConfirmedIncomeEntry[];
  /** Balances at the end of the previous month; null for the first prepared month. */
  previousEndBalances: AccountBalances | null;
  /** Logical start balances entered by the user; win over the suggestion. */
  startOverrides?: AccountBalances;
  convert?: CurrencyConverter;
}

export interface MonthPlan {
  monthKey: string;
  /** Persisted payments of the month plus the missing scheduled ones. */
  expectedPayments: Payment[];
  /** Budget total: payments (cancelled/failed excluded) + provisions. */
  chargesTotal: number;
  incomeTotal: number;
  /** `incomeTotal - chargesTotal`: « Reste à vivre (budget) ». */
  remaining: number;
  /** ACTIVE accounts only. */
  startBalances: AccountBalances;
}

/**
 * Payments a month expects: the persisted ones (any status) plus the scheduled
 * ones that are not persisted yet (`missingPayments`, from the first day of the
 * month, kept when due in that month). Persisted and scheduled match on the
 * `YYYY-MM-DD` of `dueDate`. A scheduled payment gets
 * `id = expected:<chargeId>:<YYYY-MM-DD>`, status PENDING, no paidAt/transactionId.
 */
export function expectedMonthPayments(
  _charges: Charge[],
  _payments: Payment[],
  _monthKey: string
): Payment[] {
  throw new Error('not implemented: expectedMonthPayments');
}

/**
 * Suggested start balance of each ACTIVE account from the previous month end:
 * carried as is, except a `deferredCard` account ending negative, which is
 * repaid at month end and starts at 0. Account missing from `previousEnd`
 * (or `previousEnd` null): its `openingBalance`.
 */
export function suggestMonthStart(
  _accounts: Account[],
  _previousEnd: AccountBalances | null
): AccountBalances {
  throw new Error('not implemented: suggestMonthStart');
}

/** The plan of a month prepared at its start (see types). */
export function computeMonthPlan(_input: MonthPlanInput): MonthPlan {
  throw new Error('not implemented: computeMonthPlan');
}
