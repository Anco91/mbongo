/**
 * Mark Payment as Paid API Route
 * 
 * Mark a scheduled payment as paid.
 * 
 * @module API/Charges/[id]/Payments/[paymentId]/Paid
 */

import { chargesController } from '@/server/charges/charges.controller';

type Context = { params: Promise<{ id: string; paymentId: string }> };

/**
 * PATCH /api/charges/:id/payments/:paymentId/paid
 * Mark a payment as paid
 */
export const PATCH = async (_request: Request, { params }: Context) => {
  const { paymentId } = await params;
  return chargesController.markPaymentAsPaid(paymentId);
};
