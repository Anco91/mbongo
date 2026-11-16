/**
 * M4 UI Fixes — Shared Logic Tests
 *
 * Covers:
 * - resolveRate (live/fallback fusion, no invented rate)
 * - PAYMENT_STATUS_LABELS mapping (codes → FR labels, identity for FR)
 *
 * @module Tests/M4/UiFixes
 */

import {
  resolveRate,
  PAYMENT_STATUS_LABELS,
  paymentStatusLabel,
  type Transfer,
} from '@mbongo/shared';
import {
  classifySankeyNodes,
  sankeyNodeColor,
} from '@/components/common/sankey-flows-chart';

describe('resolveRate (consolidated.ts)', () => {
  const transfers: Transfer[] = [
    {
      id: 'tr-1',
      sourceAccountId: 'a1',
      targetAccountId: 'a2',
      amountSent: 1000,
      amountReceived: 950,
      rateEstimated: 0.94,
      rateEffective: 0.95,
      rateDate: '2026-11-01T00:00:00.000Z',
      sentAt: '2026-11-01T00:00:00.000Z',
      status: 'COMPLETED',
      fees: 0,
      memo: null,
      receivedAt: '2026-11-02T00:00:00.000Z',
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    },
  ];

  it('prefers the live rate when valid', () => {
    const resolved = resolveRate(
      { rate: 0.9231, rateDate: '2026-11-16' },
      transfers
    );
    expect(resolved).toEqual({
      rate: 0.9231,
      rateDate: '2026-11-16',
      source: 'live',
    });
  });

  it('falls back to the latest known transfer rate when live is null', () => {
    const resolved = resolveRate(null, transfers);
    expect(resolved).toEqual({
      rate: 0.95,
      rateDate: '2026-11-02T00:00:00.000Z',
      source: 'fallback',
    });
  });

  it('falls back when the live rate is invalid (0)', () => {
    const resolved = resolveRate({ rate: 0, rateDate: '2026-11-16' }, transfers);
    expect(resolved).toEqual({
      rate: 0.95,
      rateDate: '2026-11-02T00:00:00.000Z',
      source: 'fallback',
    });
  });

  it('returns null when nothing is available (no invented rate)', () => {
    expect(resolveRate(null, [])).toBeNull();
  });
});

describe('classifySankeyNodes (sankey-flows-chart palette)', () => {
  const nodes = [{ name: 'Salaire' }, { name: 'UBS Courant' }, { name: 'Logement' }];

  it('classifies nodes by degree: income / account / expense', () => {
    const links = [
      { source: 0, target: 1, value: 3000 }, // Salaire → UBS
      { source: 1, target: 2, value: 1850 }, // UBS → Logement
    ];
    expect(classifySankeyNodes(nodes, links)).toEqual([
      'income',
      'account',
      'expense',
    ]);
  });

  it('keeps a distinct color per node type (readable palette)', () => {
    expect(new Set([
      sankeyNodeColor('income'),
      sankeyNodeColor('account'),
      sankeyNodeColor('expense'),
    ]).size).toBe(3);
  });
});

describe('PAYMENT_STATUS_LABELS (payment-status.ts)', () => {

  it('maps every display code to a French label', () => {
    expect(PAYMENT_STATUS_LABELS).toEqual({
      UPCOMING: 'À venir',
      DUE: 'Dû',
      PAID: 'Payé',
      CANCELLED: 'Annulé',
      FAILED: 'Échec',
      ESTIMATED: 'Estimé',
      COMPLETED: 'Réalisé',
      PENDING: 'En attente',
    });
  });

  it('translates raw codes', () => {
    expect(paymentStatusLabel('DUE')).toBe('Dû');
    expect(paymentStatusLabel('COMPLETED')).toBe('Réalisé');
  });

  it('keeps French labels unchanged (no break for existing callers)', () => {
    expect(paymentStatusLabel('Dû')).toBe('Dû');
    expect(paymentStatusLabel('Réalisé')).toBe('Réalisé');
  });
});
