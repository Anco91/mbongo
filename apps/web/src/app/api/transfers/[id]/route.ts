/**
 * Transfer API Route (Dynamic Segment)
 *
 * Pure wiring for individual transfer operations.
 * All requests are delegated to the TransfersController.
 *
 * @module API/Transfers/[id]
 */

import { NextResponse } from 'next/server';
import { transfersController } from '@/server/transfers/transfers.controller';

// Type for Next.js dynamic route context
type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/transfers/:id
 * Find a transfer by ID
 */
export const GET = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => transfersController.findOne((await params).id);

/**
 * PATCH /api/transfers/:id
 * Complete a transfer (phase 2 — received amount)
 */
export const PATCH = async (
  request: Request,
  { params }: Context
): Promise<NextResponse> =>
  transfersController.update(request, (await params).id);
