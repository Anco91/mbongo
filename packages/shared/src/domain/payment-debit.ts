/**
 * Payment debit — the bank movement booked when a payment is ticked as paid
 * without choosing an existing transaction (cash, not yet entered). The debit
 * lands on the charge's account so balances and net worth drop. Pure.
 *
 * @packageDocumentation
 */

import type { Currency } from '../schemas/currency';

/** Fields of a payment used to book its debit. */
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

/** Reserved `note` of a transaction booked by a manual payment tick. */
export const AUTO_DEBIT_NOTE = '__payment-auto-debit__';

/** What to do with the auto debit when a payment is edited. */
export type PaymentDebitAction = 'create' | 'delete' | 'update' | 'none';

/**
 * Decides how an edit of a payment affects its auto debit. A real
 * (reconciled) transaction is never touched: only `hasAutoDebit` payments
 * are deleted or updated. Pure.
 */
export function paymentDebitAction(
  existing: { status: string; hasAutoDebit: boolean },
  input: {
    status?: string;
    amount?: number;
    currency?: Currency;
    paidAt?: string | null;
  }
): PaymentDebitAction {
  if (existing.status !== 'PAID') {
    return input.status === 'PAID' && !existing.hasAutoDebit
      ? 'create'
      : 'none';
  }
  if (!existing.hasAutoDebit) return 'none';
  if (input.status !== undefined && input.status !== 'PAID') return 'delete';
  const changed =
    input.amount !== undefined ||
    input.currency !== undefined ||
    input.paidAt !== undefined;
  return changed ? 'update' : 'none';
}
