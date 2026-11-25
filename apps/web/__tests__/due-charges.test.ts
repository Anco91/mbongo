/**
 * Tests for computeDueCharges / computeNetOfDue — unpaid payments of the
 * current month, in EUR, provisioned charges excluded.
 */

import {
  computeDueCharges,
  computeNetOfDue,
  type Charge,
  type ConsolidatedBalance,
  type Payment,
} from '@mbongo/shared';

const TODAY = new Date('2026-11-15T10:00:00.000Z');

const charge = (over: Partial<Charge> & { id: string }): Charge =>
  ({ provisioned: false, ...over }) as Charge;

const payment = (over: Partial<Payment> & { id: string }): Payment =>
  ({
    chargeId: 'c1',
    amount: 100,
    currency: 'EUR',
    dueDate: '2026-11-20T00:00:00.000Z',
    status: 'PENDING',
    paidAt: null,
    transactionId: null,
    ...over,
  }) as Payment;

describe('computeDueCharges', () => {
  it('returns 0 without payments', () => {
    expect(computeDueCharges([], [], TODAY, 0.9)).toBe(0);
  });

  it('sums PENDING payments of the current month, not only the past-due ones', () => {
    const payments = [
      payment({ id: 'p1', amount: 100, dueDate: '2026-11-01T00:00:00.000Z' }),
      payment({ id: 'p2', amount: 250, dueDate: '2026-11-28T00:00:00.000Z' }),
    ];
    expect(
      computeDueCharges(payments, [charge({ id: 'c1' })], TODAY, 0.9)
    ).toBe(350);
  });

  it('ignores PAID, CANCELLED and FAILED payments', () => {
    const payments = [
      payment({ id: 'p1', status: 'PAID' }),
      payment({ id: 'p2', status: 'CANCELLED' }),
      payment({ id: 'p3', status: 'FAILED' }),
    ];
    expect(
      computeDueCharges(payments, [charge({ id: 'c1' })], TODAY, 0.9)
    ).toBe(0);
  });

  it('ignores payments of other months', () => {
    const payments = [
      payment({ id: 'p1', dueDate: '2026-10-31T00:00:00.000Z' }),
      payment({ id: 'p2', dueDate: '2026-12-01T00:00:00.000Z' }),
    ];
    expect(
      computeDueCharges(payments, [charge({ id: 'c1' })], TODAY, 0.9)
    ).toBe(0);
  });

  it('excludes payments of provisioned charges (no double count)', () => {
    const payments = [
      payment({ id: 'p1', chargeId: 'c1', amount: 100 }),
      payment({ id: 'p2', chargeId: 'c2', amount: 40 }),
    ];
    const charges = [
      charge({ id: 'c1', provisioned: true }),
      charge({ id: 'c2' }),
    ];
    expect(computeDueCharges(payments, charges, TODAY, 0.9)).toBe(40);
  });

  it('converts CHF payments to EUR at the rate, rounded to cents', () => {
    const payments = [
      payment({ id: 'p1', amount: 1000, currency: 'CHF' }),
      payment({ id: 'p2', amount: 50, currency: 'EUR' }),
    ];
    expect(
      computeDueCharges(payments, [charge({ id: 'c1' })], TODAY, 0.9231)
    ).toBe(973.1);
  });

  it('returns null when a CHF payment cannot be converted (no rate)', () => {
    const payments = [payment({ id: 'p1', currency: 'CHF' })];
    expect(
      computeDueCharges(payments, [charge({ id: 'c1' })], TODAY, null)
    ).toBeNull();
  });

  it('still sums EUR payments without a rate', () => {
    const payments = [payment({ id: 'p1', amount: 80 })];
    expect(
      computeDueCharges(payments, [charge({ id: 'c1' })], TODAY, null)
    ).toBe(80);
  });
});

describe('computeNetOfDue', () => {
  const consolidated = (totalEur: number | null): ConsolidatedBalance => ({
    totalEur,
    totalChf: 0,
    rate: 0.9,
    rateDate: '2026-11-01',
    isAvailable: totalEur !== null,
  });

  it('subtracts the due charges from the gross total', () => {
    expect(computeNetOfDue(consolidated(10000), 500)).toBe(9500);
  });

  it('returns null when the gross total is unavailable', () => {
    expect(computeNetOfDue(consolidated(null), 500)).toBeNull();
  });

  it('returns null when due charges are unknown', () => {
    expect(computeNetOfDue(consolidated(10000), null)).toBeNull();
  });

  it('can go negative', () => {
    expect(computeNetOfDue(consolidated(100), 500)).toBe(-400);
  });
});
