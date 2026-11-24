/**
 * Tests for findUnmatchedIncome — transactions positives non rapprochées
 * et propositions de rattachement à une source de revenu.
 */

import {
  findUnmatchedIncome,
  type Income,
  type MatchableTransaction,
} from '@mbongo/shared';

const stamp = '2026-01-01T00:00:00.000Z';

function income(overrides: Partial<Income> = {}): Income {
  return {
    id: 'inc-1',
    label: 'Salaire',
    amount: 4400,
    currency: 'CHF',
    accountId: 'acc-1',
    memberId: null,
    frequency: 'monthly',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: null,
    active: true,
    createdAt: stamp,
    updatedAt: stamp,
    ...overrides,
  };
}

function tx(overrides: Partial<MatchableTransaction> = {}): MatchableTransaction {
  return {
    id: 'tx-1',
    accountId: 'acc-1',
    date: '2026-11-25T12:00:00.000Z',
    amount: 4400,
    transferId: null,
    incomeId: null,
    budgetMonth: null,
    ...overrides,
  };
}

describe('findUnmatchedIncome', () => {
  it('lists a positive transaction with no income and no transfer', () => {
    const result = findUnmatchedIncome([tx()], []);
    expect(result).toEqual([
      {
        transactionId: 'tx-1',
        accountId: 'acc-1',
        date: '2026-11-25T12:00:00.000Z',
        amount: 4400,
        budgetMonth: '2026-11',
        proposals: [],
      },
    ]);
  });

  it('ignores debits, transfer legs and transactions already linked to a source', () => {
    const result = findUnmatchedIncome(
      [
        tx({ id: 'debit', amount: -50 }),
        tx({ id: 'target', transferId: 'tr-1' }),
        tx({ id: 'linked', incomeId: 'inc-1', budgetMonth: '2026-11' }),
      ],
      [income()]
    );
    expect(result).toEqual([]);
  });

  it('proposes an active source due that month on the same account, settled when equal', () => {
    const [entry] = findUnmatchedIncome([tx()], [income()]);
    expect(entry.proposals).toEqual([
      {
        incomeId: 'inc-1',
        budgetMonth: '2026-11',
        settlement: { status: 'settled', expected: 4400, realized: 4400, gap: 0 },
      },
    ]);
  });

  it('reports the gap when the amount differs from the planned one', () => {
    const [entry] = findUnmatchedIncome([tx({ amount: 4000 })], [income()]);
    expect(entry.proposals[0].settlement).toEqual({
      status: 'partial',
      expected: 4400,
      realized: 4000,
      gap: -400,
    });
  });

  it('passes the tolerance option to the settlement', () => {
    const [entry] = findUnmatchedIncome([tx({ amount: 4390 })], [income()], {
      tolerance: 10,
    });
    expect(entry.proposals[0].settlement.status).toBe('settled');
    expect(entry.proposals[0].settlement.gap).toBe(-10);
  });

  it('does not propose inactive, not-due or other-account sources', () => {
    const [entry] = findUnmatchedIncome(
      [tx()],
      [
        income({ id: 'inactive', active: false }),
        income({ id: 'future', startDate: '2027-01-01T00:00:00.000Z' }),
        income({ id: 'elsewhere', accountId: 'acc-2' }),
        income({ id: 'yearly-other-month', frequency: 'yearly', startDate: '2025-03-10T00:00:00.000Z' }),
      ]
    );
    expect(entry.proposals).toEqual([]);
  });

  it('does not propose a source already confirmed for that month', () => {
    const result = findUnmatchedIncome(
      [tx(), tx({ id: 'confirmed', incomeId: 'inc-1', budgetMonth: '2026-11' })],
      [income()]
    );
    expect(result).toHaveLength(1);
    expect(result[0].proposals).toEqual([]);
  });

  it('still proposes a source confirmed for another month', () => {
    const result = findUnmatchedIncome(
      [tx(), tx({ id: 'october', incomeId: 'inc-1', budgetMonth: '2026-10' })],
      [income()]
    );
    expect(result[0].proposals.map((p) => p.incomeId)).toEqual(['inc-1']);
  });

  it('takes the month from the transaction date', () => {
    const [entry] = findUnmatchedIncome(
      [tx({ date: '2026-03-10T12:00:00.000Z' })],
      [income({ startDate: '2026-06-01T00:00:00.000Z' })]
    );
    expect(entry.budgetMonth).toBe('2026-03');
    expect(entry.proposals).toEqual([]);
  });

  it('orders proposals by smallest absolute gap, then by income id', () => {
    const [entry] = findUnmatchedIncome(
      [tx({ amount: 4400 })],
      [
        income({ id: 'b', amount: 4400 }),
        income({ id: 'far', amount: 3000 }),
        income({ id: 'a', amount: 4400 }),
        income({ id: 'near', amount: 4300 }),
      ]
    );
    expect(entry.proposals.map((p) => p.incomeId)).toEqual(['a', 'b', 'near', 'far']);
  });

  it('orders unmatched transactions by date, then by id', () => {
    const result = findUnmatchedIncome(
      [
        tx({ id: 'z', date: '2026-11-02T12:00:00.000Z' }),
        tx({ id: 'b', date: '2026-11-01T12:00:00.000Z' }),
        tx({ id: 'a', date: '2026-11-01T12:00:00.000Z' }),
      ],
      []
    );
    expect(result.map((r) => r.transactionId)).toEqual(['a', 'b', 'z']);
  });

  it('returns an empty list for no transactions', () => {
    expect(findUnmatchedIncome([], [income()])).toEqual([]);
  });

  it('does not mutate its inputs', () => {
    const transactions = [tx()];
    const incomes = [income()];
    const before = JSON.stringify({ transactions, incomes });
    findUnmatchedIncome(transactions, incomes);
    expect(JSON.stringify({ transactions, incomes })).toBe(before);
  });
});
