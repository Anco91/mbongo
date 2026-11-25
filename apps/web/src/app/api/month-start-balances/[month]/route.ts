/**
 * Month Start Balances API Routes
 *
 * GET /api/month-start-balances/{month} - Saved start balances of a month
 * PUT /api/month-start-balances/{month} - Save start balances (idempotent)
 */

import { monthStartBalancesController } from '@/server/month-start-balances/month-start-balances.controller';

export const GET = (
  _request: Request,
  { params }: { params: Promise<{ month: string }> }
): Promise<Response> =>
  params.then(({ month }) => monthStartBalancesController.findByMonth(month));

export const PUT = (
  request: Request,
  { params }: { params: Promise<{ month: string }> }
): Promise<Response> =>
  params.then(({ month }) => monthStartBalancesController.save(month, request));
