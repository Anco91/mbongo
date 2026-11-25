/**
 * Projected balance: household balances at the end of a month, real for a
 * past month, real-to-date plus expected flows for the current or a future one.
 *
 * @packageDocumentation
 */
import { format } from 'date-fns';
import { cardBilling } from '../../domain/card-billing';
import { balanceAsOf } from '../../domain/balance';
import { computeMonthExpectedIncome } from '../../domain/income';
import type { Account } from '../../schemas/account';
import type { Charge } from '../../schemas/charge';
import type { Income } from '../../schemas/income';
import type { Payment } from '../../schemas/payment';
import type { Transaction } from '../../schemas/transaction';
import type { Transfer } from '../../schemas/transfer';
import { computeConsolidatedBalance } from './consolidated';
import { transferLegAmount } from './sankey';

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

const MONTH_LENGTH = 7;
const DAY_LENGTH = 10;
/** Lexicographic upper bound of any day of a `YYYY-MM` month. */
const LAST_DAY_SUFFIX = '-31';

const toMonth = (iso: string): string => iso.slice(0, MONTH_LENGTH);
const toDay = (iso: string): string => iso.slice(0, DAY_LENGTH);

/** `past`, `current` or `future` compared with the UTC month of `today`. */
export function computeMonthState(monthKey: string, today: Date): MonthState {
  const current = toMonth(today.toISOString());
  if (monthKey < current) return 'past';
  return monthKey === current ? 'current' : 'future';
}

/** Last day (UTC, noon) of a `YYYY-MM` month. */
function endOfMonthDate(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0, 12));
}

/** Month keys from `from` to `to` included. */
function monthsBetween(from: string, to: string): string[] {
  const keys: string[] = [];
  let [year, month] = from.split('-').map(Number);
  let key = from;
  while (key <= to) {
    keys.push(key);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    key = `${year}-${String(month).padStart(2, '0')}`;
  }
  return keys;
}

/** Signed amounts to add per account id. */
type Deltas = Map<string, number>;

function addDelta(deltas: Deltas, accountId: string, amount: number): void {
  deltas.set(accountId, (deltas.get(accountId) ?? 0) + amount);
}

/** Cash flows after today and up to the end of `monthKey`. */
function futureFlows(input: ProjectionInput): Deltas {
  const { transactions, today, monthKey } = input;
  const todayDay = toDay(today.toISOString());
  const lastDay = `${monthKey}${LAST_DAY_SUFFIX}`;
  const deltas: Deltas = new Map();

  // 1. Transactions dated after today (confirmed income, SOURCE legs, ahead).
  for (const tx of transactions) {
    const day = toDay(tx.date);
    if (day > todayDay && day <= lastDay)
      addDelta(deltas, tx.accountId, tx.amount);
  }

  // 2. Due incomes not confirmed yet, at their planned amount.
  const confirmed = transactions
    .filter((tx) => tx.incomeId && tx.amount > 0)
    .map((tx) => ({
      incomeId: tx.incomeId ?? null,
      budgetMonth: tx.budgetMonth ?? null,
      amount: tx.amount,
    }));
  const incomeAccount = new Map(input.incomes.map((i) => [i.id, i.accountId]));
  for (const key of monthsBetween(toMonth(today.toISOString()), monthKey)) {
    const { entries } = computeMonthExpectedIncome(
      input.incomes,
      confirmed,
      key
    );
    for (const entry of entries) {
      const accountId = incomeAccount.get(entry.incomeId);
      if (!entry.confirmed && accountId)
        addDelta(deltas, accountId, entry.amount);
    }
  }

  // 3. PENDING payments due by the end of the month, overdue and provisioned included.
  const chargeAccount = new Map(input.charges.map((c) => [c.id, c.accountId]));
  for (const payment of input.payments) {
    const accountId = chargeAccount.get(payment.chargeId);
    if (payment.status !== 'PENDING' || !accountId) continue;
    if (toDay(payment.dueDate) <= lastDay)
      addDelta(deltas, accountId, -payment.amount);
  }

  return deltas;
}

/** Transfer and card flows after today. */
function settlementFlows(input: ProjectionInput, deltas: Deltas): void {
  const { accounts, transactions, today, monthKey } = input;
  const lastDay = `${monthKey}${LAST_DAY_SUFFIX}`;
  const byId = new Map(accounts.map((a) => [a.id, a]));

  // 4. ESTIMATED transfers whose TARGET leg is not booked yet.
  const withTarget = new Set(
    transactions
      .filter((t) => t.transferRole === 'TARGET')
      .map((t) => t.transferId)
  );
  for (const tr of input.transfers) {
    const source = byId.get(tr.sourceAccountId);
    const target = byId.get(tr.targetAccountId);
    if (tr.status !== 'ESTIMATED' || withTarget.has(tr.id) || !target) continue;
    if (toDay(tr.sentAt) > lastDay) continue;
    const amount = transferLegAmount(
      tr,
      source?.currency ?? target.currency,
      target.currency,
      tr.rateEstimated
    );
    addDelta(deltas, target.id, amount);
  }

  // 5. Next billing of each credit card linked to a settlement account.
  for (const card of accounts) {
    if (card.accountType !== 'CREDIT_CARD' || !card.linkedAccountId) continue;
    const own = transactions.filter((t) => t.accountId === card.id);
    const billing = cardBilling(card, own, today);
    if (!billing.nextBillingDate || billing.encours <= 0) continue;
    const billingDay = format(billing.nextBillingDate, 'yyyy-MM-dd');
    if (billingDay > lastDay) continue;
    addDelta(deltas, card.id, billing.encours);
    addDelta(deltas, card.linkedAccountId, -billing.encours);
  }
}

const roundCents = (value: number): number => Math.round(value * 100) / 100 + 0;

export function computeProjectedBalance(
  input: ProjectionInput
): ProjectedBalance {
  const { accounts, transactions, today, monthKey, rate } = input;
  const state = computeMonthState(monthKey, today);
  const active = accounts.filter((a) => a.status === 'ACTIVE');

  const asOf = state === 'past' ? endOfMonthDate(monthKey) : today;
  const deltas: Deltas = new Map();
  if (state !== 'past') {
    for (const [id, amount] of futureFlows(input)) addDelta(deltas, id, amount);
    settlementFlows(input, deltas);
  }

  const balances: Record<string, number> = {};
  for (const account of active) {
    balances[account.id] = roundCents(
      balanceAsOf(account, transactions, asOf) + (deltas.get(account.id) ?? 0)
    );
  }

  const { totalEur } = computeConsolidatedBalance(
    accounts,
    balances,
    [],
    rate ? { rate, rateDate: today.toISOString() } : null
  );
  return { state, balances, totalEur };
}
