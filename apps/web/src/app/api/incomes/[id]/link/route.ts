/**
 * Income Link API Route
 *
 * POST /api/incomes/{id}/link - Link an existing transaction to an income and month
 */

import { incomesController } from '@/server/incomes/incomes.controller';

export const POST = (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> =>
  params.then(({ id }) => incomesController.link(id, request));
