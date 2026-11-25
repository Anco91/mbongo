/**
 * Wealth card view (spec 48): the single pure source of the numbers the
 * dashboard wealth card shows for a month. A past or current month shows
 * account balances (lines and total from the same balances); a future month
 * shows the month budget only (income − charges), never an account balance.
 *
 * @packageDocumentation
 */
import type { Account } from '../../schemas/account';
import type { Charge } from '../../schemas/charge';
import type { Income } from '../../schemas/income';
import type { Payment } from '../../schemas/payment';
import type { Transaction } from '../../schemas/transaction';
import type { Transfer } from '../../schemas/transfer';
import type { ConfirmedIncomeEntry } from '../../domain/income';
import type { CurrencyConverter } from '../../domain/schedule';
import { listNetWorthTerms, type NetWorthTerm } from './consolidated';
import { computeMonthPlan } from './month-journey';
import {
  computeMonthState,
  computeProjectedBalance,
  type MonthState,
} from './projected-balance';

export interface WealthViewInput {
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  payments: Payment[];
  charges: Charge[];
  incomes: Income[];
  confirmedIncome: ConfirmedIncomeEntry[];
  today: Date;
  /** Displayed month, `YYYY-MM`. */
  monthKey: string;
  /** CHF → EUR rate, or null when unknown. */
  rate: number | null;
  /** Saved start balances (spec 43); never shown for a future month. */
  startOverrides?: Record<string, number>;
  convert?: CurrencyConverter;
}

export interface WealthView {
  state: MonthState;
  /** `balances`: past/current month; `budget`: future month, no balance. */
  kind: 'balances' | 'budget';
  /** Lines of the card; empty for a future month. Same balances as the total. */
  terms: NetWorthTerm[];
  /** Consolidated EUR of `terms`; null for a future month or without a rate. */
  totalEur: number | null;
  /** Expected income and charges of the month; `remaining` = income − charges. */
  budget: { incomeTotal: number; chargesTotal: number; remaining: number };
}

/**
 * Numbers of the wealth card for a month. A future month never inherits an
 * account balance: only that month's income and charges are shown. Past and
 * current months show the (projected) balances, lines and total from the same
 * balances.
 */
export function computeWealthView(input: WealthViewInput): WealthView {
  const { monthKey, today } = input;
  const state = computeMonthState(monthKey, today);
  const plan = computeMonthPlan({
    monthKey,
    accounts: input.accounts,
    charges: input.charges,
    payments: input.payments,
    incomes: input.incomes,
    confirmedIncome: input.confirmedIncome,
    previousEndBalances: null,
    convert: input.convert,
  });
  const budget = {
    incomeTotal: plan.incomeTotal,
    chargesTotal: plan.chargesTotal,
    remaining: plan.remaining,
  };
  if (state === 'future') {
    return { state, kind: 'budget', terms: [], totalEur: null, budget };
  }
  const projection = computeProjectedBalance({
    accounts: input.accounts,
    transactions: input.transactions,
    transfers: input.transfers,
    payments: input.payments,
    charges: input.charges,
    incomes: input.incomes,
    today,
    monthKey,
    rate: input.rate,
    startOverrides: input.startOverrides,
  });
  return {
    state,
    kind: 'balances',
    terms: listNetWorthTerms(input.accounts, projection.balances),
    totalEur: projection.totalEur,
    budget,
  };
}
