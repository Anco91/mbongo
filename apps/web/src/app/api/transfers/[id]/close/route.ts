/**
 * Transfer Close API Route
 *
 * Pure wiring: delegates to the TransfersController.
 *
 * @module API/Transfers/[id]/close
 */

import { NextResponse } from 'next/server';
import { transfersController } from '@/server/transfers/transfers.controller';

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/transfers/:id/close
 * Close (archive) a transfer
 */
export const POST = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => transfersController.close((await params).id);
