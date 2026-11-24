/**
 * Locked tests for 24-consolidated-balance-accuracy: ticking a payment as
 * paid books a debit on the charge's account so the balance drops once.
 *
 * @module Tests/Payments/PaymentDebit
 */
import { planPaymentDebit, computeBalance } from '@mbongo/shared';

const payment = {
  amount: 950,
  currency: 'CHF' as const,
  dueDate: '2026-11-01T00:00:00.000Z',
  paidAt: null as string | null,
};
const account = { id: 'acc-chf', currency: 'CHF' as const };

describe('planPaymentDebit', () => {
  it('debits the charge account by the payment amount', () => {
    expect(
      planPaymentDebit(payment, account, '2026-11-03T00:00:00.000Z')
    ).toEqual({
      accountId: 'acc-chf',
      date: '2026-11-03T00:00:00.000Z',
      amount: -950,
    });
  });

  it('dates the debit by the argument, else the payment paidAt, else the due date', () => {
    const paid = { ...payment, paidAt: '2026-11-02T00:00:00.000Z' };
    expect(planPaymentDebit(paid, account).date).toBe(
      '2026-11-02T00:00:00.000Z'
    );
    expect(planPaymentDebit(payment, account).date).toBe(payment.dueDate);
    expect(
      planPaymentDebit(paid, account, '2026-11-05T00:00:00.000Z').date
    ).toBe('2026-11-05T00:00:00.000Z');
  });

  it('refuses a payment whose currency differs from the account', () => {
    expect(() =>
      planPaymentDebit(payment, { id: 'acc-eur', currency: 'EUR' })
    ).toThrow(RangeError);
  });

  it('lowers the account balance by exactly the amount', () => {
    const debit = planPaymentDebit(payment, account);
    expect(computeBalance({ openingBalance: 2389 }, [debit])).toBe(1439);
  });
});
