/**
 * Tests for the shared `missingPayments` function.
 *
 * This function powers the UI recovery after a failed grouped payment
 * creation (spec M2-CHARGE-PAYMENTS-001).
 *
 * @module Tests/ScheduleMissingPayments
 */

import { Charge, Payment, missingPayments } from '@mbongo/shared';

// ============================================================================
// Fixtures
// ============================================================================

const baseCharge: Charge = {
  id: '00000000-0000-4000-8000-000000000001',
  label: 'Tax',
  type: 'INSTALLMENT',
  amount: 1200,
  currency: 'CHF',
  accountId: '00000000-0000-4000-8000-000000000002',
  category: 'Taxes',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: null,
  frequency: null,
  installments: 4,
  provisioned: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

function makeExistingPayment(dueDate: string): Payment {
  return {
    id: '00000000-0000-4000-8000-000000000010',
    chargeId: baseCharge.id,
    amount: 300,
    currency: 'CHF',
    dueDate,
    status: 'PENDING',
    paidAt: null,
    transactionId: null,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('missingPayments', () => {
  it('returns the full schedule when no payment is persisted', () => {
    const missing = missingPayments(baseCharge, [], new Date('2024-06-01'));

    expect(missing).toHaveLength(4);
    expect(missing.map((p) => p.dueDate)).toEqual([
      '2024-01-01T00:00:00.000Z',
      '2024-02-01T00:00:00.000Z',
      '2024-03-01T00:00:00.000Z',
      '2024-04-01T00:00:00.000Z',
    ]);
    expect(missing.every((p) => p.amount === 300)).toBe(true);
    expect(missing.every((p) => p.chargeId === baseCharge.id)).toBe(true);
  });

  it('returns only the payments not yet persisted', () => {
    const missing = missingPayments(
      baseCharge,
      [makeExistingPayment('2024-01-01T00:00:00.000Z')],
      new Date('2024-06-01')
    );

    expect(missing).toHaveLength(3);
    expect(missing.map((p) => p.dueDate)).toEqual([
      '2024-02-01T00:00:00.000Z',
      '2024-03-01T00:00:00.000Z',
      '2024-04-01T00:00:00.000Z',
    ]);
  });

  it('compares instants regardless of the ISO serialization format', () => {
    // Same instant as 2024-01-01T00:00:00.000Z expressed with an offset
    const missing = missingPayments(
      baseCharge,
      [makeExistingPayment('2024-01-01T01:00:00.000+01:00')],
      new Date('2024-06-01')
    );

    expect(missing).toHaveLength(3);
    expect(missing.some((p) => p.dueDate === '2024-01-01T00:00:00.000Z')).toBe(
      false
    );
  });

  it('returns an empty list when every payment is already persisted', () => {
    const existing = [
      '2024-01-01T00:00:00.000Z',
      '2024-02-01T00:00:00.000Z',
      '2024-03-01T00:00:00.000Z',
      '2024-04-01T00:00:00.000Z',
    ].map(makeExistingPayment);

    const missing = missingPayments(
      baseCharge,
      existing,
      new Date('2024-06-01')
    );

    expect(missing).toEqual([]);
  });
});
