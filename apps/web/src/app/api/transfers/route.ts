/**
 * Transfers API Route
 *
 * Pure wiring (the main.ts role in Nest): no logic lives here.
 * All requests are delegated to the TransfersController.
 *
 * @module API/Transfers
 */

import { NextResponse } from 'next/server';
import { transfersController } from '@/server/transfers/transfers.controller';

/**
 * GET /api/transfers
 * Find transfers with optional filtering and pagination
 */
export const GET = (request: Request): Promise<NextResponse> =>
  transfersController.find(request);

/**
 * POST /api/transfers
 * Create a transfer (phase 1 — estimated)
 */
export const POST = (request: Request): Promise<NextResponse> =>
  transfersController.create(request);
