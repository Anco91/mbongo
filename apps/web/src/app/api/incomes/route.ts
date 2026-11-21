/**
 * Incomes API Routes
 *
 * GET /api/incomes - List incomes
 * POST /api/incomes - Create income
 */

import { incomesController } from '@/server/incomes/incomes.controller';

export const GET = (request: Request): Promise<Response> =>
  incomesController.find(request);
export const POST = (request: Request): Promise<Response> =>
  incomesController.create(request);
