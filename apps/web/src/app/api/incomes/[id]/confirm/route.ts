/**
 * Income Confirm API Route
 *
 * POST /api/incomes/{id}/confirm - Confirm income for a month (idempotent)
 */

import { incomesController } from '@/server/incomes/incomes.controller';

export const POST = (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> =>
  params.then(({ id }) => incomesController.confirm(id, request));
