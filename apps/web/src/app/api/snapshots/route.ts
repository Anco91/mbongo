/**
 * Snapshots API Route
 *
 * Pure wiring (the main.ts role in Nest): no logic lives here.
 * All requests are delegated to the SnapshotsController.
 *
 * @module API/Snapshots
 */

import { NextResponse } from 'next/server';
import { snapshotsController } from '@/server/snapshots/snapshots.controller';

/**
 * GET /api/snapshots
 * Find balance snapshots with optional filtering
 */
export const GET = (request: Request): Promise<NextResponse> =>
  snapshotsController.find(request);

/**
 * POST /api/snapshots
 * Record a manual balance snapshot (the balance anchor)
 */
export const POST = (request: Request): Promise<NextResponse> =>
  snapshotsController.create(request);
