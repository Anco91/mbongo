/**
 * Charge API Route (Dynamic Segment)
 *
 * Pure wiring for individual charge operations.
 * All requests are delegated to the ChargesController.
 *
 * @module API/Charges/[id]
 */

import { NextResponse } from 'next/server';
import { chargesController } from '@/server/charges/charges.controller';

// Type for Next.js dynamic route context
type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/charges/:id
 * Find a charge by ID
 */
export const GET = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => chargesController.findOne((await params).id);

/**
 * PATCH /api/charges/:id
 * Update a charge
 */
export const PATCH = async (
  request: Request,
  { params }: Context
): Promise<NextResponse> =>
  chargesController.update(request, (await params).id);

/**
 * DELETE /api/charges/:id
 * Delete a charge
 */
export const DELETE = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => chargesController.remove((await params).id);
