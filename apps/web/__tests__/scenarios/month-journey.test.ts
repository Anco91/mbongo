/**
 * Spec 39 — month journey: prepare month X, then X+1 and X+2 with nothing
 * entered (locked). Fixture: `__tests__/stubs/month-journey-fixture.ts`.
 * Today = 2026-11-15; X = 2026-12 (future). EUR only. Hand-checked numbers:
 *
 * Income: salary 3000, no end date, every month.
 * Charges: rent 900 (no end, dueDay 3; December payment persisted),
 *   insurance 60 (no end, dueDay 10), TV 250 (ONE_OFF, December),
 *   gym 20 (TEMPORARY, ends 2026-12-31).
 *
 * | Month | Payments                    | Charges | Income | Remaining |
 * |-------|-----------------------------|---------|--------|-----------|
 * | X     | 900 + 60 + 250 + 20         | 1230    | 3000   | 1770      |
 * | X+1   | 900 + 60                    | 960     | 3000   | 2040      |
 * | X+2   | 900 + 60                    | 960     | 3000   | 2040      |
 * | X+1 with insurance cancelled (persisted) | 900 | 3000 | 2100  |
 *
 * Start balances (X, user input): current 1800, deferred -320 (entered as is);
 * overdraft -100 and savings 5000 = opening balance; closed account absent.
 * End of X: current 1500, deferred -320, overdraft -100, savings 5000.
 * Start of X+1: current 1500, deferred 0 (repaid at month end), overdraft -100
 * (carried), savings 5000. Override current 1400 wins over 1500.
 * End of X+1: deferred -50 -> start of X+2: 0.
 */
import {
  computeMonthPlan,
  expectedMonthPayments,
  suggestMonthStart,
  type MonthPlanInput,
} from '@mbongo/shared';
import {
  ACCOUNTS,
  CHARGES,
  INCOMES,
  P_INS_JAN_CANCELLED,
  PAYMENTS,
  X,
  X1,
  X2,
} from '../stubs/month-journey-fixture';

const END_OF_X = { 'a-cur': 1500, 'a-bnp': -320, 'a-over': -100, 'a-sav': 5000 };

function plan(
  monthKey: string,
  over: Partial<MonthPlanInput> = {}
): ReturnType<typeof computeMonthPlan> {
  return computeMonthPlan({
    monthKey,
    accounts: ACCOUNTS,
    charges: CHARGES,
    payments: PAYMENTS,
    incomes: INCOMES,
    confirmedIncome: [],
    previousEndBalances: null,
    ...over,
  });
}

const labels = (monthKey: string, payments = PAYMENTS): string[] =>
  expectedMonthPayments(CHARGES, payments, monthKey)
    .map((p) => p.chargeId)
    .sort();

describe('month X (December, prepared at its start)', () => {
  it('keeps the persisted rent once and schedules the rest', () => {
    expect(labels(X)).toEqual(['c-gym', 'c-ins', 'c-rent', 'c-tv']);
    const rent = expectedMonthPayments(CHARGES, PAYMENTS, X).find(
      (p) => p.chargeId === 'c-rent'
    );
    expect(rent?.id).toBe('p-rent-dec');
  });

  it('marks a scheduled payment as expected and pending', () => {
    const tv = expectedMonthPayments(CHARGES, PAYMENTS, X).find(
      (p) => p.chargeId === 'c-tv'
    );
    expect(tv).toMatchObject({
      id: 'expected:c-tv:2026-12-12',
      amount: 250,
      status: 'PENDING',
      paidAt: null,
      transactionId: null,
    });
  });

  it('budgets income minus fixed items and the one-off expense', () => {
    const p = plan(X);
    expect(p.chargesTotal).toBe(1230);
    expect(p.incomeTotal).toBe(3000);
    expect(p.remaining).toBe(1770);
  });

  it('starts from the logical balance entered, else the opening balance', () => {
    const p = plan(X, { startOverrides: { 'a-cur': 1800, 'a-bnp': -320 } });
    expect(p.startBalances).toEqual({
      'a-cur': 1800,
      'a-bnp': -320,
      'a-over': -100,
      'a-sav': 5000,
    });
  });
});

describe('month X+1 (nothing entered)', () => {
  it('takes the fixed items again, without the one-off or the ended item', () => {
    expect(labels(X1)).toEqual(['c-ins', 'c-rent']);
  });

  it('budgets the same fixed items', () => {
    const p = plan(X1, { previousEndBalances: END_OF_X });
    expect(p.chargesTotal).toBe(960);
    expect(p.incomeTotal).toBe(3000);
    expect(p.remaining).toBe(2040);
  });

  it('does not carry the deferred-debit overdraft, carries the ordinary one', () => {
    expect(suggestMonthStart(ACCOUNTS, END_OF_X)).toEqual({
      'a-cur': 1500,
      'a-bnp': 0,
      'a-over': -100,
      'a-sav': 5000,
    });
  });

  it('lets the user override the suggested start balance', () => {
    const p = plan(X1, {
      previousEndBalances: END_OF_X,
      startOverrides: { 'a-cur': 1400 },
    });
    expect(p.startBalances['a-cur']).toBe(1400);
    expect(p.startBalances['a-bnp']).toBe(0);
  });

  it('keeps a positive deferred-debit balance', () => {
    const start = suggestMonthStart(ACCOUNTS, { ...END_OF_X, 'a-bnp': 80 });
    expect(start['a-bnp']).toBe(80);
  });

  it('does not schedule a persisted cancelled payment again', () => {
    const p = plan(X1, { payments: [...PAYMENTS, P_INS_JAN_CANCELLED] });
    expect(p.chargesTotal).toBe(900);
    expect(p.remaining).toBe(2100);
  });
});

describe('month X+2 (nothing entered)', () => {
  it('equals X+1: same items, same totals, no leak from December', () => {
    expect(labels(X2)).toEqual(['c-ins', 'c-rent']);
    const p = plan(X2, {
      previousEndBalances: { ...END_OF_X, 'a-bnp': -50 },
    });
    expect(p.chargesTotal).toBe(960);
    expect(p.remaining).toBe(2040);
  });

  it('starts the deferred-debit account at 0 again', () => {
    const p = plan(X2, { previousEndBalances: { ...END_OF_X, 'a-bnp': -50 } });
    expect(p.startBalances['a-bnp']).toBe(0);
  });

  it('leaves closed accounts out of the start balances', () => {
    const p = plan(X2, { previousEndBalances: END_OF_X });
    expect(p.startBalances).not.toHaveProperty('a-old');
  });
});
