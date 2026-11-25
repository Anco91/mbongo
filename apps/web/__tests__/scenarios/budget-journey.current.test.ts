/**
 * Spec 34 — budget journey on existing functions only (locked).
 *
 * Fictional household, today = 2026-11-15, 1 CHF = 1.05 EUR. Fixture:
 * `__tests__/stubs/budget-journey-fixture.ts`. Hand-checked numbers:
 *
 * | Month | Scenario                       | Expected           | Today's code |
 * |-------|--------------------------------|--------------------|--------------|
 * | Nov   | budget: 900 paid + 30 pending  | pay 930, prov 150, total 1080 | same (green) |
 * | Dec   | budget, nothing done           | pay 930, prov 150, total 1080 | same (green) |
 * | Dec   | income, salary 4000 CHF        | 4200 EUR planned   | same (green) |
 * | Dec   | salary confirmed early 4100    | 4305 EUR, Nov 4200 | same (green) |
 * | Aug   | provision before tax starts    | 100 (ins only)     | 150  (RED)   |
 * | Jan27 | provision after tax ended      | 100 (ins only)     | 150  (RED)   |
 * | Oct   | cancelled payment              | pay 900, total 1050| 930/1080 (RED) |
 * | Nov   | CHF provision 335/12 in EUR    | 29.31              | 27.92 (RED)  |
 * | Nov   | dues: Nov 30 + overdue Oct 900 | 930                | 30   (RED)   |
 * | Nov   | Sankey expenses = budget total | 1080               | 2130 (RED)   |
 * | Nov   | donut total = budget total     | 1080               | 2130 (RED)   |
 *
 * 2130 = rent 900 + phone 30 + insurance payment 1200 (the smoothed charge
 * is counted by its payment, not by its 100 + 50 monthly provision).
 */
import {
  computeDonutExpenses,
  computeDueCharges,
  computeMonthExpectedIncome,
  computeMonthlyBudget,
  computeSankeyFlows,
  type Account,
  type SankeyData,
} from '@mbongo/shared';
import {
  ACCOUNTS,
  CHARGES,
  INCOMES,
  P_INS_NOV,
  P_PHONE_NOV,
  P_RENT_NOV,
  PAYMENTS,
  RATE,
  SERAFE,
  T_RENT_NOV,
  T_SALARY_DEC_EARLY,
  TODAY,
  convert,
  month,
} from '../stubs/budget-journey-fixture';

const NOV_PAYMENTS = [P_RENT_NOV, P_PHONE_NOV, P_INS_NOV];

/** Sum of the links that end on a spending category, not on an account. */
function expenseTotal(data: SankeyData, accounts: Account[]): number {
  const accountNames = new Set(accounts.map((a) => a.name));
  const total = data.links
    .filter((l) => !accountNames.has(data.nodes[l.target].name))
    .reduce((sum, l) => sum + l.value, 0);
  return Math.round(total * 100) / 100;
}

describe('budget journey — months with nothing wrong today', () => {
  it('counts smoothed charges by provision and the rest by payments (Nov)', () => {
    const budget = computeMonthlyBudget(
      CHARGES,
      PAYMENTS,
      month('2026-11'),
      convert
    );
    expect(budget.paymentsTotal).toBe(930);
    expect(budget.provisionsTotal).toBe(150);
    expect(budget.total).toBe(1080);
  });

  it('prepares December from the schedule alone: same total, income 4200 EUR', () => {
    const budget = computeMonthlyBudget(
      CHARGES,
      PAYMENTS,
      month('2026-12'),
      convert
    );
    expect(budget.total).toBe(1080);
    expect(
      computeMonthExpectedIncome(INCOMES, [], '2026-12', convert).total
    ).toBe(4200);
  });

  it('keeps the provision on the end date month (Dec 31 included)', () => {
    expect(
      computeMonthlyBudget(CHARGES, PAYMENTS, month('2026-12'), convert)
        .provisionsTotal
    ).toBe(150);
  });
});

describe('budget journey — salary confirmed early', () => {
  const confirmed = [
    {
      incomeId: 'inc-salary',
      budgetMonth: '2026-12',
      amount: T_SALARY_DEC_EARLY.amount,
    },
  ];

  it('replaces the planned amount in its own month only', () => {
    const dec = computeMonthExpectedIncome(
      INCOMES,
      confirmed,
      '2026-12',
      convert
    );
    const nov = computeMonthExpectedIncome(
      INCOMES,
      confirmed,
      '2026-11',
      convert
    );
    expect(dec.total).toBe(4305);
    expect(dec.entries[0].confirmed).toBe(true);
    expect(nov.total).toBe(4200);
    expect(nov.entries[0].confirmed).toBe(false);
  });

  it('draws one realised Sankey leg in December and a planned one in November', () => {
    const base = {
      accounts: ACCOUNTS,
      transactions: [T_SALARY_DEC_EARLY],
      transfers: [],
      payments: [],
      charges: CHARGES,
      incomes: INCOMES,
      rate: RATE,
    };
    const dec = computeSankeyFlows({ ...base, monthKey: '2026-12' });
    const nov = computeSankeyFlows({ ...base, monthKey: '2026-11' });
    expect(dec.links).toHaveLength(1);
    expect(dec.links[0].value).toBe(4305);
    expect(dec.links[0].planned).toBeUndefined();
    expect(nov.links).toHaveLength(1);
    expect(nov.links[0].value).toBe(4200);
    expect(nov.links[0].planned).toBe(true);
  });
});

describe('budget journey — provision bounded by start and end date', () => {
  it('has no provision for a charge that has not started (Aug 2026)', () => {
    expect(
      computeMonthlyBudget(CHARGES, PAYMENTS, month('2026-08'), convert)
        .provisionsTotal
    ).toBe(100);
  });

  it('has no provision for a charge that has ended (Jan 2027)', () => {
    expect(
      computeMonthlyBudget(CHARGES, PAYMENTS, month('2027-01'), convert)
        .provisionsTotal
    ).toBe(100);
  });
});

describe('budget journey — what the budget counts', () => {
  it('leaves a CANCELLED payment out of the month (Oct 2026)', () => {
    const budget = computeMonthlyBudget(
      CHARGES,
      PAYMENTS,
      month('2026-10'),
      convert
    );
    expect(budget.paymentsTotal).toBe(900);
    expect(budget.total).toBe(1050);
  });

  it('converts a CHF provision to EUR with the converter', () => {
    expect(
      computeMonthlyBudget([SERAFE], [], month('2026-11'), convert)
        .provisionsTotal
    ).toBe(29.31);
  });
});

describe('budget journey — due charges', () => {
  it('counts this month PENDING and earlier overdue PENDING, not provisioned, cancelled or future months', () => {
    expect(computeDueCharges(PAYMENTS, CHARGES, TODAY, RATE)).toBe(930);
  });

  it('counts this month PENDING alone when nothing is overdue', () => {
    const noOverdue = PAYMENTS.filter((p) => p.id !== 'p-rent-oct');
    expect(computeDueCharges(noOverdue, CHARGES, TODAY, RATE)).toBe(30);
  });
});

describe('budget journey — one monthly charge total across views (Nov)', () => {
  const budgetTotal = computeMonthlyBudget(
    CHARGES,
    PAYMENTS,
    month('2026-11'),
    convert
  ).total;

  it('shows in the Sankey the same expense total as the budget', () => {
    const sankey = computeSankeyFlows({
      accounts: ACCOUNTS,
      transactions: [T_RENT_NOV],
      transfers: [],
      payments: NOV_PAYMENTS,
      charges: CHARGES,
      incomes: INCOMES,
      monthKey: '2026-11',
      rate: RATE,
    });
    expect(expenseTotal(sankey, ACCOUNTS)).toBe(budgetTotal);
  });

  it('shows in the donut the same total as the budget, smoothed charge by provision', () => {
    const donut = computeDonutExpenses({
      payments: NOV_PAYMENTS,
      charges: CHARGES,
      transactions: [T_RENT_NOV],
      rate: RATE,
    });
    const total = donut.reduce((sum, c) => sum + c.value, 0);
    expect(Math.round(total * 100) / 100).toBe(budgetTotal);
    expect(donut.find((c) => c.name === 'Assurances')?.value).toBe(100);
  });
});
