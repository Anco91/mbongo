/**
 * Spec 48 follow-up — one charges total per month across the screens, month
 * after month (locked on delivery). For every month from 2026-09 to 2027-03:
 * budget card total = month plan charges = donut total = Sankey expense links
 * (account → category), all in EUR, whatever the month holds (cancelled,
 * provisioned, temporary charge ended, CHF).
 *
 * @module Tests/Scenarios/BudgetCoherenceScreens
 */
import {
  computeDonutExpenses,
  computeMonthPlan,
  computeMonthlyBudget,
  computeSankeyFlows,
  expectedMonthPayments,
} from '@mbongo/shared';
import {
  ACCOUNTS,
  CHARGES,
  INCOMES,
  PAYMENTS,
  RATE,
  convert,
  month,
} from '../stubs/budget-journey-fixture';

const MONTHS = [
  '2026-09',
  '2026-10',
  '2026-11',
  '2026-12',
  '2027-01',
  '2027-02',
  '2027-03',
];

const round2 = (n: number): number => Math.round(n * 100) / 100;

function figures(monthKey: string) {
  const expected = expectedMonthPayments(CHARGES, PAYMENTS, monthKey);
  const budget = computeMonthlyBudget(
    CHARGES,
    expected,
    month(monthKey),
    convert
  ).total;
  const plan = computeMonthPlan({
    monthKey,
    accounts: ACCOUNTS,
    charges: CHARGES,
    payments: PAYMENTS,
    incomes: INCOMES,
    confirmedIncome: [],
    previousEndBalances: null,
    convert,
  });
  const donut = computeDonutExpenses({
    payments: expected,
    charges: CHARGES,
    transactions: [],
    rate: RATE,
    monthKey,
  });
  const sankey = computeSankeyFlows({
    accounts: ACCOUNTS,
    transactions: [],
    transfers: [],
    payments: expected,
    charges: CHARGES,
    incomes: INCOMES,
    monthKey,
    rate: RATE,
  });
  const accountNames = new Set(ACCOUNTS.map((a) => a.name));
  const expenseLinks = sankey.links.filter(
    (l) =>
      accountNames.has(sankey.nodes[l.source].name) &&
      !accountNames.has(sankey.nodes[l.target].name)
  );
  return {
    budget,
    plan: plan.chargesTotal,
    donut: round2(donut.reduce((sum, c) => sum + c.value, 0)),
    sankey: round2(expenseLinks.reduce((sum, l) => sum + l.value, 0)),
  };
}

describe('one charges total per month, across the screens', () => {
  it.each(MONTHS)('%s: budget = plan = donut = Sankey', (monthKey) => {
    const f = figures(monthKey);
    expect(f.plan).toBe(f.budget);
    expect(f.donut).toBe(f.budget);
    expect(f.sankey).toBe(f.budget);
  });

  it('the temporary tax counts in September to December and not after', () => {
    const withTax = ['2026-09', '2026-10', '2026-11', '2026-12'];
    const without = ['2027-01', '2027-02', '2027-03'];
    for (const m of withTax) expect(figures(m).budget).toBeGreaterThan(1030);
    for (const m of without) expect(figures(m).budget).toBe(1030);
  });
});
