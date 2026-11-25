/**
 * Spec 48 — the budget stays coherent from month to month (locked).
 *
 * Rules come from the user, not from the code:
 * - a future month shows only that month's income minus that month's charges;
 *   no account balance, no account lines, no net worth;
 * - nothing carries over: December never leaks into January, and changing
 *   an account balance or today's transactions changes neither;
 * - one number per month: the card equals the budget figures;
 * - the total of the card equals the sum of its lines;
 * - past = real balance, current = real + expected, future = budget only.
 *
 * Hand-derived values (fixture: salary 4000 CHF at 1.05 = 4200 EUR; charges
 * rent 900, phone 30, insurance 1200/yr smoothed = 100; tax 600 smoothed over
 * Sep-Dec 2026 = 50/month):
 *   Dec 2026: 4200 - (900 + 30 + 100 + 50) = 3120
 *   2027-01..: 4200 - (900 + 30 + 100)     = 3170
 *   confirmed salary 4300 CHF replaces the planned 4000: 4515 - 1030 = 3485
 *   Oct 2026 (past, no transaction): 2000 + 500 + 5000 + 1000 CHF x 1.05 = 8550
 *
 * @module Tests/Scenarios/BudgetCoherence
 */
import {
  computeMonthPlan,
  computeWealthView,
  counterValue,
  type WealthViewInput,
} from '@mbongo/shared';
import {
  ACCOUNTS,
  CHARGES,
  INCOMES,
  PAYMENTS,
  RATE,
  T_RENT_NOV,
  T_SALARY_DEC_EARLY,
  TODAY,
  convert,
} from '../stubs/budget-journey-fixture';

const base: WealthViewInput = {
  accounts: ACCOUNTS,
  transactions: [],
  transfers: [],
  payments: PAYMENTS,
  charges: CHARGES,
  incomes: INCOMES,
  confirmedIncome: [],
  today: TODAY,
  monthKey: '2026-12',
  rate: RATE,
  convert,
};

const view = (monthKey: string, over: Partial<WealthViewInput> = {}) =>
  computeWealthView({ ...base, monthKey, ...over });

const FUTURE_AFTER_DEC = [
  '2027-01',
  '2027-02',
  '2027-03',
  '2027-04',
  '2027-05',
  '2027-06',
  '2027-07',
  '2027-08',
  '2027-09',
  '2027-10',
];

describe('future month: the month budget only', () => {
  it('shows the budget kind, no lines and no total, for every future month', () => {
    for (const month of ['2026-12', ...FUTURE_AFTER_DEC]) {
      const v = view(month);
      expect(v.state).toBe('future');
      expect(v.kind).toBe('budget');
      expect(v.terms).toEqual([]);
      expect(v.totalEur).toBeNull();
    }
  });

  it('is income minus charges of December: 3120', () => {
    expect(view('2026-12').budget).toEqual({
      incomeTotal: 4200,
      chargesTotal: 1080,
      remaining: 3120,
    });
  });

  it('is the same 3170 every month after the temporary tax ended', () => {
    for (const month of FUTURE_AFTER_DEC) {
      expect(view(month).budget.remaining).toBe(3170);
    }
  });

  it('does not grow from one month to the next', () => {
    const series = FUTURE_AFTER_DEC.map((m) => view(m).budget.remaining);
    expect(Math.max(...series)).toBe(Math.min(...series));
  });

  it('replaces the planned salary with the confirmed one, never both', () => {
    const v = view('2027-01', {
      confirmedIncome: [
        { incomeId: 'inc-salary', budgetMonth: '2027-01', amount: 4300 },
      ],
    });
    expect(v.budget.remaining).toBe(3485);
  });
});

describe('no carry-over between months', () => {
  it("changing December's income does not change January", () => {
    const withDec = view('2027-01', {
      confirmedIncome: [
        { incomeId: 'inc-salary', budgetMonth: '2026-12', amount: 9999 },
      ],
    });
    expect(withDec.budget.remaining).toBe(view('2027-01').budget.remaining);
    expect(
      view('2026-12', {
        confirmedIncome: [
          { incomeId: 'inc-salary', budgetMonth: '2026-12', amount: 9999 },
        ],
      }).budget.remaining
    ).not.toBe(3120);
  });

  it('January equals computeMonthPlan(January).remaining', () => {
    const plan = computeMonthPlan({
      monthKey: '2027-01',
      accounts: ACCOUNTS,
      charges: CHARGES,
      payments: PAYMENTS,
      incomes: INCOMES,
      confirmedIncome: [],
      previousEndBalances: null,
      convert,
    });
    expect(view('2027-01').budget.remaining).toBe(plan.remaining);
  });

  it('does not depend on account balances or on today transactions', () => {
    const rich = {
      accounts: ACCOUNTS.map((a) => ({
        ...a,
        openingBalance: a.openingBalance * 10,
      })),
      transactions: [T_RENT_NOV, T_SALARY_DEC_EARLY],
    };
    for (const month of ['2026-12', '2027-01']) {
      expect(view(month, rich).budget).toEqual(view(month).budget);
    }
  });

  it('a saved start balance does not turn a future month into a balance', () => {
    const v = view('2026-12', { startOverrides: { 'a-cur': 1000 } });
    expect(v.kind).toBe('budget');
    expect(v.terms).toEqual([]);
    expect(v.totalEur).toBeNull();
    expect(v.budget.remaining).toBe(3120);
  });
});

describe('one number per month', () => {
  it('equals the plan figures of the budget screens, income and charges', () => {
    for (const month of ['2026-12', '2027-01', '2027-06']) {
      const plan = computeMonthPlan({
        monthKey: month,
        accounts: ACCOUNTS,
        charges: CHARGES,
        payments: PAYMENTS,
        incomes: INCOMES,
        confirmedIncome: [],
        previousEndBalances: null,
        convert,
      });
      const b = view(month).budget;
      expect(b.incomeTotal).toBe(plan.incomeTotal);
      expect(b.chargesTotal).toBe(plan.chargesTotal);
      expect(b.remaining).toBe(plan.remaining);
    }
  });
});

describe('past and current months: balances, lines equal the total', () => {
  const sumOfLines = (v: ReturnType<typeof view>): number =>
    v.terms.reduce(
      (sum, t) =>
        sum +
        (t.currency === 'CHF' ? counterValue(t.balance, RATE) : t.balance),
      0
    );

  it('a past month is the real balance: 8550 for October', () => {
    const v = view('2026-10');
    expect(v.state).toBe('past');
    expect(v.kind).toBe('balances');
    expect(v.totalEur).toBe(8550);
  });

  it('the current month is a balances view', () => {
    const v = view('2026-11', {
      transactions: [T_RENT_NOV, T_SALARY_DEC_EARLY],
    });
    expect(v.state).toBe('current');
    expect(v.kind).toBe('balances');
    expect(v.terms.length).toBeGreaterThan(0);
  });

  it('the total equals the sum of the lines, past and current', () => {
    for (const month of ['2026-08', '2026-09', '2026-10', '2026-11']) {
      const v = view(month, {
        transactions: [T_RENT_NOV, T_SALARY_DEC_EARLY],
      });
      expect(v.totalEur).not.toBeNull();
      expect(Math.abs((v.totalEur ?? 0) - sumOfLines(v))).toBeLessThanOrEqual(
        0.01
      );
    }
  });

  it('keeps the closed accounts out of the lines', () => {
    const closed = {
      ...ACCOUNTS[0],
      id: 'a-closed',
      name: 'Ancien',
      status: 'CLOSED' as const,
      openingBalance: 99999,
    };
    const v = view('2026-10', { accounts: [...ACCOUNTS, closed] });
    expect(v.terms.some((t) => t.accountId === 'a-closed')).toBe(false);
    expect(v.totalEur).toBe(8550);
  });
});
