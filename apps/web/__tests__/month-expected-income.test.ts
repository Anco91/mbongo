/**
 * Tests for computeMonthExpectedIncome — revenus attendus d'un mois
 * (sources dues, montant confirmé qui remplace le prévu).
 */

import {
  computeMonthExpectedIncome,
  type ConfirmedIncomeEntry,
  type Income,
} from '@mbongo/shared';

function makeIncome(overrides: Partial<Income> = {}): Income {
  return {
    id: 'income-1',
    label: 'Salaire',
    amount: 4400,
    currency: 'CHF',
    accountId: 'account-1',
    memberId: null,
    frequency: 'monthly',
    startDate: '2026-01-01T12:00:00.000Z',
    endDate: null,
    active: true,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

const MONTH = '2026-11';

describe('computeMonthExpectedIncome', () => {
  it('returns zero and no entry when there is no source', () => {
    const result = computeMonthExpectedIncome([], [], MONTH);
    expect(result.total).toBe(0);
    expect(result.entries).toEqual([]);
  });

  it('counts the planned amount of a monthly source due this month', () => {
    const result = computeMonthExpectedIncome([makeIncome()], [], MONTH);
    expect(result.total).toBe(4400);
    expect(result.entries).toEqual([
      { incomeId: 'income-1', amount: 4400, currency: 'CHF', confirmed: false },
    ]);
  });

  it('ignores a source that is not due this month', () => {
    const yearly = makeIncome({
      frequency: 'yearly',
      startDate: '2026-03-15T12:00:00.000Z',
    });
    const future = makeIncome({
      id: 'income-2',
      startDate: '2027-01-01T12:00:00.000Z',
    });
    const result = computeMonthExpectedIncome([yearly, future], [], MONTH);
    expect(result.total).toBe(0);
    expect(result.entries).toEqual([]);
  });

  it('ignores an inactive source', () => {
    const result = computeMonthExpectedIncome(
      [makeIncome({ active: false })],
      [],
      MONTH
    );
    expect(result.total).toBe(0);
  });

  it('replaces the planned amount by the confirmed amount, never both', () => {
    const confirmed: ConfirmedIncomeEntry[] = [
      { incomeId: 'income-1', budgetMonth: MONTH, amount: 4500 },
    ];
    const result = computeMonthExpectedIncome([makeIncome()], confirmed, MONTH);
    expect(result.total).toBe(4500);
    expect(result.entries).toEqual([
      { incomeId: 'income-1', amount: 4500, currency: 'CHF', confirmed: true },
    ]);
  });

  it('ignores confirmations of another month or another source or without link', () => {
    const confirmed: ConfirmedIncomeEntry[] = [
      { incomeId: 'income-1', budgetMonth: '2026-10', amount: 9999 },
      { incomeId: 'income-other', budgetMonth: MONTH, amount: 9999 },
      { incomeId: null, budgetMonth: null, amount: 9999 },
    ];
    const result = computeMonthExpectedIncome([makeIncome()], confirmed, MONTH);
    expect(result.total).toBe(4400);
    expect(result.entries[0].confirmed).toBe(false);
  });

  it('sums several sources, mixing planned and confirmed', () => {
    const incomes = [
      makeIncome(),
      makeIncome({ id: 'income-2', label: 'Loyer', amount: 800 }),
    ];
    const confirmed: ConfirmedIncomeEntry[] = [
      { incomeId: 'income-2', budgetMonth: MONTH, amount: 850 },
    ];
    const result = computeMonthExpectedIncome(incomes, confirmed, MONTH);
    expect(result.total).toBe(5250);
    expect(result.entries).toHaveLength(2);
  });

  it('converts each line through the converter and rounds to 2 decimals', () => {
    const incomes = [
      makeIncome({ amount: 1000, currency: 'CHF' }),
      makeIncome({ id: 'income-2', amount: 100, currency: 'EUR' }),
    ];
    const convert = (amount: number, currency: string): number =>
      currency === 'CHF' ? amount * 1.0723 : amount;
    const result = computeMonthExpectedIncome(incomes, [], MONTH, convert);
    expect(result.total).toBe(1172.3);
  });

  it('keeps native amounts in the entries when converting', () => {
    const convert = (amount: number): number => amount * 2;
    const result = computeMonthExpectedIncome(
      [makeIncome()],
      [],
      MONTH,
      convert
    );
    expect(result.entries[0].amount).toBe(4400);
    expect(result.total).toBe(8800);
  });
});
