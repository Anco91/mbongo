/**
 * Tests for payment display status (derived "due") and reconciliation
 * candidates filtering.
 *
 * @module Tests/Domain/PaymentStatus
 * @jest-environment node
 */
import {
  isDue,
  paymentDisplayStatus,
  reconciliationCandidates,
} from '@mbongo/shared';
import { Payment, Transaction } from '@mbongo/shared';

function makePayment(overrides: Partial<Payment>): Payment {
  return {
    id: 'payment-1',
    chargeId: 'charge-1',
    amount: 312,
    currency: 'EUR',
    dueDate: '2026-12-28T00:00:00',
    status: 'PENDING',
    paidAt: null,
    transactionId: null,
    createdAt: '2026-11-01T00:00:00',
    updatedAt: '2026-11-01T00:00:00',
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: `txn-${Math.random().toString(36).slice(2)}`,
    accountId: 'bnp-perso-0001',
    date: '2026-12-28T00:00:00',
    amount: -312,
    category: null,
    note: null,
    transferId: null,
    transferRole: null,
    createdAt: '2026-12-28T00:00:00',
    updatedAt: '2026-12-28T00:00:00',
    ...overrides,
  };
}

// ============================================================================
// Statut dérivé
// ============================================================================

describe('paymentDisplayStatus', () => {
  it('shows UPCOMING for a future pending payment', () => {
    const payment = makePayment({ dueDate: '2026-12-28T00:00:00' });
    expect(paymentDisplayStatus(payment, new Date('2026-11-15T12:00:00'))).toBe(
      'UPCOMING'
    );
  });

  it('shows DUE on the due day itself (decision frozen in M2)', () => {
    const payment = makePayment({ dueDate: '2026-11-28T00:00:00' });
    expect(paymentDisplayStatus(payment, new Date('2026-11-28T23:59:59'))).toBe(
      'DUE'
    );
  });

  it('shows DUE after the due day, without any database write', () => {
    const payment = makePayment({ dueDate: '2026-11-28T00:00:00' });
    expect(paymentDisplayStatus(payment, new Date('2026-12-01T09:00:00'))).toBe(
      'DUE'
    );
  });

  it('goes back to UPCOMING when the due date is pushed later', () => {
    const payment = makePayment({ dueDate: '2026-11-15T00:00:00' });
    expect(paymentDisplayStatus(payment, new Date('2026-11-20T09:00:00'))).toBe(
      'DUE'
    );
    // La date est repoussée au 28 : l'échéance redevient « à venir »
    // sans aucune écriture en base.
    const pushed = makePayment({ dueDate: '2026-11-28T00:00:00' });
    expect(paymentDisplayStatus(pushed, new Date('2026-11-20T09:00:00'))).toBe(
      'UPCOMING'
    );
  });

  it('keeps PAID paid regardless of dates', () => {
    const payment = makePayment({
      status: 'PAID',
      dueDate: '2020-01-01T00:00:00',
    });
    expect(paymentDisplayStatus(payment, new Date('2026-11-15T12:00:00'))).toBe(
      'PAID'
    );
  });

  it('isDue mirrors paymentDisplayStatus', () => {
    const payment = makePayment({ dueDate: '2026-11-28T00:00:00' });
    expect(isDue(payment, new Date('2026-11-28T00:00:00'))).toBe(true);
    expect(isDue(payment, new Date('2026-11-27T23:59:59'))).toBe(false);
  });
});

// ============================================================================
// Candidats de rapprochement
// ============================================================================

describe('reconciliationCandidates', () => {
  const payment = makePayment({ amount: 312, dueDate: '2026-12-28T00:00:00' });

  it('keeps transactions within ±0.01 and ±7 days', () => {
    const candidates = reconciliationCandidates(payment, [
      makeTransaction({ id: 'exact', amount: -312, date: '2026-12-27T00:00:00' }),
      makeTransaction({ id: 'tolerated', amount: -312.01, date: '2027-01-04T00:00:00' }),
    ]);
    expect(candidates.map((t) => t.id)).toEqual(['exact', 'tolerated']);
  });

  it('rejects a wrong amount even within the date window', () => {
    const candidates = reconciliationCandidates(payment, [
      makeTransaction({ amount: -310 }),
    ]);
    expect(candidates).toHaveLength(0);
  });

  it('rejects a matching amount outside the ±7 day window', () => {
    const candidates = reconciliationCandidates(payment, [
      makeTransaction({ date: '2027-01-10T00:00:00' }),
    ]);
    expect(candidates).toHaveLength(0);
  });

  it('matches a positive transaction of the same magnitude', () => {
    // Sens indifférent : une saisie "à tort" en crédit reste candidate.
    const candidates = reconciliationCandidates(payment, [
      makeTransaction({ amount: 312 }),
    ]);
    expect(candidates).toHaveLength(1);
  });

  it('returns an empty list with no transaction', () => {
    expect(reconciliationCandidates(payment, [])).toHaveLength(0);
  });
});
