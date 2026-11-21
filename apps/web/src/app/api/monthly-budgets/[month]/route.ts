/**
 * Monthly Budget API Routes
 *
 * GET /api/monthly-budgets/{month} - Get monthly budget state
 * PUT /api/monthly-budgets/{month} - Prepare month (idempotent)
 */

import { monthlyBudgetsController } from '@/server/monthly-budgets/monthly-budgets.controller';

export const GET = (
  _request: Request,
  { params }: { params: Promise<{ month: string }> }
): Promise<Response> =>
  params.then(({ month }) => monthlyBudgetsController.findOne(month));

export const PUT = (
  request: Request,
  { params }: { params: Promise<{ month: string }> }
): Promise<Response> =>
  params.then(({ month }) => monthlyBudgetsController.prepare(month, request));
