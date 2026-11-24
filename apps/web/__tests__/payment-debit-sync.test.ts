/**
 * Locked tests for fix-review-rows-21-26: the auto-debit booked by a manual
 * tick must follow the payment (un-tick, edit, unlink) and never double count.
 *
 * @module Tests/Payments/PaymentDebitSync
 */
import { AUTO_DEBIT_NOTE, paymentDebitAction } from '@mbongo/shared';

const pending = { status: 'PENDING' as const, hasAutoDebit: false };
const tickedByHand = { status: 'PAID' as const, hasAutoDebit: true };
const reconciled = { status: 'PAID' as const, hasAutoDebit: false };

describe('AUTO_DEBIT_NOTE', () => {
  it('is a non-empty marker string', () => {
    expect(typeof AUTO_DEBIT_NOTE).toBe('string');
    expect(AUTO_DEBIT_NOTE.length).toBeGreaterThan(0);
  });
});

describe('paymentDebitAction', () => {
  it('creates the debit when a pending payment is ticked', () => {
    expect(paymentDebitAction(pending, { status: 'PAID' })).toBe('create');
  });

  it('does nothing when a payment reconciled to a real transaction is ticked again', () => {
    expect(paymentDebitAction(reconciled, { status: 'PAID' })).toBe('none');
  });

  it('does not book a second debit when an auto-debited payment is ticked again', () => {
    expect(paymentDebitAction(tickedByHand, { status: 'PAID' })).toBe('none');
  });

  it.each(['PENDING', 'CANCELLED', 'FAILED'] as const)(
    'deletes the auto debit when the payment goes back to %s',
    (status) => {
      expect(paymentDebitAction(tickedByHand, { status })).toBe('delete');
    }
  );

  it('never deletes a real reconciled transaction on un-tick', () => {
    expect(paymentDebitAction(reconciled, { status: 'PENDING' })).toBe('none');
  });

  it('updates the debit when amount, currency or paidAt change on a ticked payment', () => {
    expect(paymentDebitAction(tickedByHand, { amount: 900 })).toBe('update');
    expect(paymentDebitAction(tickedByHand, { currency: 'EUR' })).toBe(
      'update'
    );
    expect(
      paymentDebitAction(tickedByHand, { paidAt: '2026-11-05T00:00:00.000Z' })
    ).toBe('update');
  });

  it('does nothing for an unrelated edit', () => {
    expect(paymentDebitAction(tickedByHand, {})).toBe('none');
    expect(paymentDebitAction(pending, { amount: 900 })).toBe('none');
  });
});
