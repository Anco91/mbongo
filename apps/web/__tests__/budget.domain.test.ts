/**
 * Tests for Budget Domain Logic
 *
 * Vérifie le calcul des revenus d'un mois à partir des transactions.
 */

import { computeMonthIncome, MonthIncomeEntry } from '@mbongo/shared';

describe('computeMonthIncome', () => {
  const entries: MonthIncomeEntry[] = [
    {
      amount: 4400,
      date: '2026-11-01T12:00:00.000Z',
      transferId: null,
      currency: 'CHF',
    },
    {
      amount: 500,
      date: '2026-11-15T12:00:00.000Z',
      transferId: null,
      currency: 'EUR',
    },
    {
      amount: -100,
      date: '2026-11-20T12:00:00.000Z',
      transferId: null,
      currency: 'CHF',
    },
    {
      amount: 200,
      date: '2026-10-15T12:00:00.000Z',
      transferId: null,
      currency: 'CHF',
    },
    {
      amount: 300,
      date: '2026-11-10T12:00:00.000Z',
      transferId: 'transfer-1',
      currency: 'CHF',
    },
  ];

  it('exclut les transferts et montants négatifs', () => {
    const result = computeMonthIncome(entries, '2026-11');
    // 4400 (CHF) + 500 (EUR) — transfert et négatif exclus
    expect(result.total).toBe(4900);
    expect(result.entries).toHaveLength(2);
  });

  it('exclut les entrées hors du mois', () => {
    const result = computeMonthIncome(entries, '2026-11');
    // L'entrée d'octobre (200 CHF) est exclue
    expect(result.entries.find((e) => e.amount === 200)).toBeUndefined();
  });

  it('applique le convertisseur de devise', () => {
    const convert = (amount: number, currency: string) =>
      currency === 'EUR' ? amount * 1.1 : amount;

    const result = computeMonthIncome(entries, '2026-11', convert);
    // 4400 CHF + 500 EUR * 1.1 = 4400 + 550 = 4950
    expect(result.total).toBe(4950);
  });

  it('retourne 0 pour un mois sans entrées', () => {
    const result = computeMonthIncome([], '2026-11');
    expect(result.total).toBe(0);
    expect(result.entries).toHaveLength(0);
  });

  it('arrondit à 2 décimales', () => {
    const entriesWithDecimals: MonthIncomeEntry[] = [
      {
        amount: 100.555,
        date: '2026-11-01T12:00:00.000Z',
        transferId: null,
        currency: 'CHF',
      },
      {
        amount: 200.444,
        date: '2026-11-02T12:00:00.000Z',
        transferId: null,
        currency: 'CHF',
      },
    ];
    const result = computeMonthIncome(entriesWithDecimals, '2026-11');
    expect(result.total).toBe(301);
  });
});
