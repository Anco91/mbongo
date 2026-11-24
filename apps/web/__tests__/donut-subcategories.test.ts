/**
 * Donut sub-category breakdown (row 10b): `computeDonutExpenses` keeps one
 * segment per category and adds a `subcategories` breakdown;
 * `mergeCategorySegments` merges planned + realized rows for the legend.
 */

import {
  computeDonutExpenses,
  mergeCategorySegments,
  type Charge,
  type Payment,
  type Transaction,
} from '@mbongo/shared';

function charge(
  id: string,
  category: string,
  subcategory: string | null
): Charge {
  return {
    id,
    label: id,
    type: 'FIXED_RECURRING',
    amount: 10,
    currency: 'EUR',
    accountId: 'acc',
    category,
    subcategory,
    startDate: '2026-01-01',
    endDate: null,
    frequency: 'monthly',
    installments: null,
    dueDay: null,
    provisioned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function payment(
  id: string,
  chargeId: string,
  amount: number,
  currency: 'EUR' | 'CHF' = 'EUR',
  status: Payment['status'] = 'PAID'
): Payment {
  return {
    id,
    chargeId,
    amount,
    currency,
    dueDate: '2026-11-01T00:00:00.000Z',
    status,
    paidAt: status === 'PAID' ? '2026-11-01T00:00:00.000Z' : null,
    transactionId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  } as Payment;
}

function expense(id: string, category: string, amount: number): Transaction {
  return {
    id,
    accountId: 'acc',
    amount: -amount,
    category,
    date: '2026-11-05T00:00:00.000Z',
    note: null,
    transferId: null,
    transferRole: null,
    createdAt: '2026-11-05T00:00:00.000Z',
    updatedAt: '2026-11-05T00:00:00.000Z',
  } as Transaction;
}

describe('computeDonutExpenses sub-category breakdown', () => {
  const charges = [
    charge('mobile', 'Abonnements', 'Mobile'),
    charge('internet', 'Abonnements', 'Internet'),
    charge('plain', 'Abonnements', null),
    charge('rent', 'Logement', null),
  ];

  it('keeps one segment per category and lists sub-categories by descending amount', () => {
    const result = computeDonutExpenses({
      charges,
      payments: [payment('p1', 'mobile', 30), payment('p2', 'internet', 50)],
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Abonnements');
    expect(result[0].value).toBe(80);
    expect(result[0].subcategories).toEqual([
      { name: 'Internet', value: 50 },
      { name: 'Mobile', value: 30 },
    ]);
  });

  it('groups charges without sub-category and transactions under "Autres" when a sub-category exists', () => {
    const result = computeDonutExpenses({
      charges,
      payments: [payment('p1', 'mobile', 30), payment('p2', 'plain', 20)],
      transactions: [expense('t1', 'Abonnements', 5)],
    });

    expect(result[0].value).toBe(55);
    expect(result[0].subcategories).toEqual([
      { name: 'Mobile', value: 30 },
      { name: 'Autres', value: 25 },
    ]);
  });

  it('has no breakdown when no charge of the category carries a sub-category', () => {
    const result = computeDonutExpenses({
      charges,
      payments: [payment('p1', 'rent', 900)],
      transactions: [expense('t1', 'Vie courante', 40)],
    });

    expect(result).toHaveLength(2);
    for (const segment of result) {
      expect(segment.subcategories).toBeUndefined();
    }
  });

  it('converts CHF amounts of a sub-category at the rate', () => {
    const result = computeDonutExpenses({
      charges,
      payments: [payment('p1', 'mobile', 100, 'CHF')],
      rate: 0.95,
    });

    expect(result[0].value).toBe(95);
    expect(result[0].subcategories).toEqual([{ name: 'Mobile', value: 95 }]);
  });

  it('breaks the planned share down separately from the realized one', () => {
    const result = computeDonutExpenses({
      charges,
      payments: [
        payment('p1', 'mobile', 30),
        payment('p2', 'internet', 50, 'EUR', 'PENDING'),
      ],
    });

    const realized = result.find((s) => !s.planned);
    const planned = result.find((s) => s.planned);
    expect(realized?.subcategories).toEqual([{ name: 'Mobile', value: 30 }]);
    expect(planned?.subcategories).toEqual([{ name: 'Internet', value: 50 }]);
  });

  it('does not count a charge sub-category on an unknown charge', () => {
    const result = computeDonutExpenses({
      charges: [],
      payments: [payment('p1', 'ghost', 10)],
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Autres');
    expect(result[0].subcategories).toBeUndefined();
  });
});

describe('mergeCategorySegments', () => {
  it('merges planned and realized rows of one category, breakdown included', () => {
    const merged = mergeCategorySegments([
      {
        name: 'Abonnements',
        value: 30,
        subcategories: [{ name: 'Mobile', value: 30 }],
      },
      {
        name: 'Abonnements',
        value: 70,
        planned: true,
        subcategories: [
          { name: 'Internet', value: 50 },
          { name: 'Mobile', value: 20 },
        ],
      },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].value).toBe(100);
    expect(merged[0].subcategories).toEqual([
      { name: 'Internet', value: 50 },
      { name: 'Mobile', value: 50 },
    ]);
  });

  it('keeps the order of first appearance and leaves a plain category plain', () => {
    const merged = mergeCategorySegments<{
      name: string;
      value: number;
      planned?: boolean;
      subcategories?: Array<{ name: string; value: number }>;
    }>([
      { name: 'Logement', value: 900 },
      { name: 'Vie courante', value: 40 },
      { name: 'Logement', value: 100, planned: true },
    ]);

    expect(merged.map((m) => [m.name, m.value])).toEqual([
      ['Logement', 1000],
      ['Vie courante', 40],
    ]);
    expect(merged[0].subcategories).toBeUndefined();
  });

  it('does not mutate its input', () => {
    const input = [
      { name: 'A', value: 1, subcategories: [{ name: 'x', value: 1 }] },
      { name: 'A', value: 2, subcategories: [{ name: 'x', value: 2 }] },
    ];
    const snapshot = JSON.parse(JSON.stringify(input));
    mergeCategorySegments(input);
    expect(input).toEqual(snapshot);
  });

  it('returns an empty list for an empty input', () => {
    expect(mergeCategorySegments([])).toEqual([]);
  });
});
