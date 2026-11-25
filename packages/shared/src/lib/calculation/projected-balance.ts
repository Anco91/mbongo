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
  /**
   * Saved start balance per account id. For a current/future month an ACTIVE
   * account listed here is anchored: start + flows dated in `monthKey` only.
   */
  startOverrides?: Record<string, number>;
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

/** Lower bounds (exclusive days, inclusive month) of the flows counted. */
interface FlowWindow {
  /** Transactions dated strictly after this day. */
  txAfter: string;
  /** Payments, transfers and card billings dated strictly after this day. */
  after: string;
  /** First month of the unconfirmed incomes. */
  fromMonth: string;
}

/** Real-to-date path: flows after today, overdue items included. */
function sinceToday(input: ProjectionInput): FlowWindow {
  return {
    txAfter: toDay(input.today.toISOString()),
    after: '',
    fromMonth: toMonth(input.today.toISOString()),
  };
}

/** Anchored path: flows of the target month only (`-00` sorts before `-01`). */
function monthOnly(input: ProjectionInput): FlowWindow {
  return {
    txAfter: `${input.monthKey}-00`,
    after: `${input.monthKey}-00`,
    fromMonth: input.monthKey,
  };
}

/** Cash flows inside the window, up to the end of `monthKey`. */
function futureFlows(input: ProjectionInput, window: FlowWindow): Deltas {
  const { transactions, monthKey } = input;
  const lastDay = `${monthKey}${LAST_DAY_SUFFIX}`;
  const deltas: Deltas = new Map<string, number>();

  // 1. Transactions dated after today (confirmed income, SOURCE legs, ahead).
  for (const tx of transactions) {
    const day = toDay(tx.date);
    if (day > window.txAfter && day <= lastDay)
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
  for (const key of monthsBetween(window.fromMonth, monthKey)) {
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
    const due = toDay(payment.dueDate);
    if (due > window.after && due <= lastDay)
      addDelta(deltas, accountId, -payment.amount);
  }

  return deltas;
}

/** Transfer and card flows inside the window. */
function settlementFlows(input: ProjectionInput, window: FlowWindow): Deltas {
  const deltas: Deltas = new Map<string, number>();
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
    const target =
      tr.targetAccountId === null ? undefined : byId.get(tr.targetAccountId);
    if (tr.status !== 'ESTIMATED' || withTarget.has(tr.id) || !target) continue;
    const sentDay = toDay(tr.sentAt);
    if (sentDay <= window.after || sentDay > lastDay) continue;
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
    if (billingDay <= window.after || billingDay > lastDay) continue;
    addDelta(deltas, card.id, billing.encours);
    addDelta(deltas, card.linkedAccountId, -billing.encours);
  }
  return deltas;
}

/** All flows of a window (cash flows, then transfers and cards). */
function windowFlows(input: ProjectionInput, window: FlowWindow): Deltas {
  const deltas = futureFlows(input, window);
  for (const [id, amount] of settlementFlows(input, window))
    addDelta(deltas, id, amount);
  return deltas;
}

const roundCents = (value: number): number => Math.round(value * 100) / 100 + 0;

export function computeProjectedBalance(
  input: ProjectionInput
): ProjectedBalance {
  const { accounts, transactions, today, monthKey, rate } = input;
  const state = computeMonthState(monthKey, today);
  const active = accounts.filter((a) => a.status === 'ACTIVE');

  const asOf = state === 'past' ? endOfMonthDate(monthKey) : today;
  const overrides = state === 'past' ? {} : (input.startOverrides ?? {});
  const isAnchored = (id: string): boolean => id in overrides;
  const deltas: Deltas =
    state === 'past'
      ? new Map<string, number>()
      : windowFlows(input, sinceToday(input));
  const anchoredDeltas: Deltas = active.some((a) => isAnchored(a.id))
    ? windowFlows(input, monthOnly(input))
    : new Map<string, number>();

  const balances: Record<string, number> = {};
  for (const account of active) {
    balances[account.id] = roundCents(
      isAnchored(account.id)
        ? overrides[account.id] + (anchoredDeltas.get(account.id) ?? 0)
        : balanceAsOf(account, transactions, asOf) +
            (deltas.get(account.id) ?? 0)
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
