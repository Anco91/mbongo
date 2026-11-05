/**
 * Charge Next Payment API Route
 *
 * Get the next scheduled payment for a charge.
 *
 * @module API/Charges/[id]/Payments/Next
 */

import { chargesController } from '@/server/charges/charges.controller';

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/charges/:id/payments/next
 * Get the next scheduled payment for a charge
 */
export const GET = async (_request: Request, { params }: Context) =>
  chargesController.getNextPayment((await params).id);
