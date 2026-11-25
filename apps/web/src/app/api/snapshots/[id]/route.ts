/**
 * Snapshot API Route (Dynamic Segment)
 *
 * Pure wiring: the request is delegated to the SnapshotsController.
 *
 * @module API/Snapshots/[id]
 */

import { NextResponse } from 'next/server';
import { snapshotsController } from '@/server/snapshots/snapshots.controller';

type Context = { params: Promise<{ id: string }> };

/**
 * DELETE /api/snapshots/:id
 * Remove a balance snapshot (a mistaken statement)
 */
export const DELETE = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => snapshotsController.remove((await params).id);
