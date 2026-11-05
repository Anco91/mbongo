/**
 * Charge Payments API Route
 * 
 * Operations for managing scheduled payments of a charge.
 * 
 * @module API/Charges/[id]/Payments
 */

import { chargesController } from '@/server/charges/charges.controller';

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/charges/:id/payments
 * Get all payments for a charge
 */
export const GET = async (_request: Request, { params }: Context) =>
  chargesController.getPayments((await params).id);
