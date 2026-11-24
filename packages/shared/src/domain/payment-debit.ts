/**
 * Payment debit — the bank movement booked when a payment is ticked as paid
 * without choosing an existing transaction (cash, not yet entered). The debit
 * lands on the charge's account so balances and net worth drop. Pure.
 *
 * @packageDocumentation
 */

/** Fields of a payment used to book its debit. */
import type { Currency } from '../schemas/currency';

export interface PaymentDebitSource {
  amount: number;
  currency: Currency;
  dueDate: string;
  paidAt: string | null;
}

/** Account that carries the charge. */
export interface PaymentDebitAccount {
  id: string;
  currency: Currency;
}

/** Transaction to create (negative amount, no transfer, no income). */
export interface PaymentDebit {
  accountId: string;
  date: string;
  amount: number;
}

/**
 * Debit booked for a manually paid payment: `-amount` on the account, dated
 * `paidAt` (argument, else the payment's own, else its due date).
 * Throws `RangeError` when payment and account currencies differ.
 */
export function planPaymentDebit(
  payment: PaymentDebitSource,
  account: PaymentDebitAccount,
  paidAt?: string | null
): PaymentDebit {
  if (payment.currency !== account.currency) {
    throw new RangeError(
      `Payment currency ${payment.currency} differs from account currency ${account.currency}`
    );
  }
  return {
    accountId: account.id,
    date: paidAt ?? payment.paidAt ?? payment.dueDate,
    amount: -payment.amount,
  };
}
