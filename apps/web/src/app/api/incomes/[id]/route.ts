/**
 * Income API Routes
 *
 * PATCH /api/incomes/{id} - Update income
 * DELETE /api/incomes/{id} - Remove income
 */

import { incomesController } from '@/server/incomes/incomes.controller';

export const PATCH = (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> =>
  params.then(({ id }) => incomesController.update(id, request));

export const DELETE = (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> => params.then(({ id }) => incomesController.remove(id));
