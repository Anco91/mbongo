/**
 * Spec 53 — balances day by day (locked). Small hand-computed household,
 * independent of the big fixture except for its account/transaction shapes.
 * Today = 2026-11-15 noon UTC. EUR only, no charge, no income, no payment.
 *
 * cur (current account) opens at 1000. Transactions:
 *   Nov 2  salary    +2000
 *   Nov 3  rent       -800
 *   Nov 25 insurance  -100  (after today)
 * def (deferred-debit card, settles itself, no link) opens at 0:
 *   Nov 5  purchase    -100
 *   Nov 15 purchase     -50  (today)
 *   Nov 20 purchase     -70  (after today)
 *
 * Current month, S + X - Y = Z:
 *   S = 1000 (start of November), X = +2000, Y = 800 + 100
 *   Z = 1000 + 2000 - 800 - 100 = 2100 (end of November)
 *   today (Nov 15) = 1000 + 2000 - 800 = 2200
 * Deferred card: -100 on Nov 5, -150 on Nov 15, -220 at end of November.
 *   Nothing is ever debited from cur for the card (no grouped debit).
 *   Total end of November = 2100 - 220 = 1880.
 */
import {
  balanceAsOf,
  computeProjectedBalance,
  type Account,
  type Transaction,
} from '@mbongo/shared';
import {
  ACCOUNTS,
  PHONE,
  P_PHONE_NOV_PAID,
  TODAY,
  T_DEFERRED,
  T_PHONE_NOV,
} from '../stubs/budget-journey-fixture';

const CUR: Account = {
  ...ACCOUNTS[0],
  id: 'cur',
  name: 'Courant',
  openingBalance: 1000,
};
const DEF: Account = {
  ...ACCOUNTS[0],
  id: 'def',
  name: 'Carte différée',
  deferredCard: true,
  openingBalance: 0,
};

function tx(
  id: string,
  accountId: string,
  amount: number,
  date: string
): Transaction {
  return { ...T_DEFERRED, id, accountId, amount, date };
}

const SALARY = tx('t-salary', 'cur', 2000, '2026-11-02T12:00:00.000Z');
const RENT = tx('t-rent', 'cur', -800, '2026-11-03T12:00:00.000Z');
const INSURANCE = tx('t-ins', 'cur', -100, '2026-11-25T12:00:00.000Z');
const CARD_PAST = tx('t-card-past', 'def', -100, '2026-11-05T12:00:00.000Z');
const CARD_TODAY = tx('t-card-today', 'def', -50, '2026-11-15T12:00:00.000Z');
const CARD_FUTURE = tx('t-card-future', 'def', -70, '2026-11-20T12:00:00.000Z');

const ALL_TX = [SALARY, RENT, INSURANCE, CARD_PAST, CARD_TODAY, CARD_FUTURE];

function project(
  monthKey: string,
  over: {
    transactions?: Transaction[];
    startOverrides?: Record<string, number>;
  } = {}
) {
  return computeProjectedBalance({
    accounts: [CUR, DEF],
    transactions: over.transactions ?? ALL_TX,
    transfers: [],
    payments: [],
    charges: [],
    incomes: [],
    today: TODAY,
    monthKey,
    rate: 1,
    startOverrides: over.startOverrides,
  });
}

describe('current month: start S + income X - expenses Y = end Z', () => {
  it('is 2100 at the end of November from the real path', () => {
    expect(balanceAsOf(CUR, ALL_TX, TODAY)).toBe(2200);
    expect(project('2026-11').balances.cur).toBe(2100);
  });

  it('is the same 2100 when anchored on the saved start of 1000', () => {
    const anchored = project('2026-11', { startOverrides: { cur: 1000 } });
    expect(anchored.balances.cur).toBe(2100);
  });

  it('counts the future expense once: today 2200, end 2100', () => {
    expect(balanceAsOf(CUR, [SALARY, RENT], TODAY)).toBe(2200);
    expect(
      project('2026-11', { transactions: [SALARY, RENT] }).balances.cur
    ).toBe(2200);
  });
});

describe('deferred card purchase lowers its balance on its day', () => {
  it('is -100 the day before the second purchase', () => {
    expect(balanceAsOf(DEF, ALL_TX, new Date('2026-11-14T23:59:00.000Z'))).toBe(
      -100
    );
  });

  it('is -150 on the day of the second purchase, whatever the hour', () => {
    expect(balanceAsOf(DEF, ALL_TX, TODAY)).toBe(-150);
    expect(balanceAsOf(DEF, ALL_TX, new Date('2026-11-15T00:00:00.000Z'))).toBe(
      -150
    );
  });

  it('is -220 at the end of November, and the linked account is not charged', () => {
    const nov = project('2026-11');
    expect(nov.balances.def).toBe(-220);
    expect(nov.balances.cur).toBe(2100);
    expect(nov.totalEur).toBe(1880);
  });

  it('never debits the linked account for the card, in any later month', () => {
    const dec = project('2026-12');
    expect(dec.balances.cur).toBe(2100);
  });
});

describe('direct debit lowers the balance the same day', () => {
  const debit = (date: string) => tx('t-dd', 'cur', -60, date);

  it('counts a debit dated today at any hour', () => {
    expect(
      balanceAsOf(CUR, [SALARY, RENT, debit('2026-11-15T00:00:00.000Z')], TODAY)
    ).toBe(2140);
    expect(
      balanceAsOf(CUR, [SALARY, RENT, debit('2026-11-15T23:59:00.000Z')], TODAY)
    ).toBe(2140);
  });

  it('leaves out a debit dated tomorrow today, and counts it in the month end', () => {
    const transactions = [SALARY, RENT, debit('2026-11-16T12:00:00.000Z')];
    expect(balanceAsOf(CUR, transactions, TODAY)).toBe(2200);
    expect(project('2026-11', { transactions }).balances.cur).toBe(2140);
  });

  it('does not count a paid payment twice (debit booked today, payment PAID)', () => {
    const transactions = [SALARY, RENT, T_PHONE_NOV];
    const state = computeProjectedBalance({
      accounts: [{ ...CUR, id: T_PHONE_NOV.accountId }],
      transactions: [
        { ...SALARY, accountId: T_PHONE_NOV.accountId },
        { ...RENT, accountId: T_PHONE_NOV.accountId },
        T_PHONE_NOV,
      ],
      transfers: [],
      payments: [P_PHONE_NOV_PAID],
      charges: [PHONE],
      incomes: [],
      today: TODAY,
      monthKey: '2026-11',
      rate: null,
    });
    expect(transactions).toHaveLength(3);
    expect(state.balances[T_PHONE_NOV.accountId]).toBe(2170);
  });
});
