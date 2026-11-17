/**
 * Member API Route (Dynamic Segment)
 *
 * Pure wiring for individual member operations (M4, vue foyer).
 * All requests are delegated to the MembersController.
 *
 * @module API/Members/[id]
 */

import { NextResponse } from 'next/server';
import { membersController } from '@/server/members/members.controller';

// Type for Next.js dynamic route context
type Context = { params: Promise<{ id: string }> };

/**
 * PATCH /api/members/:id
 * Update a household member
 */
export const PATCH = async (
  request: Request,
  { params }: Context
): Promise<NextResponse> =>
  membersController.update(request, (await params).id);

/**
 * DELETE /api/members/:id
 * Delete a household member (accounts are unlinked, not deleted)
 */
export const DELETE = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => membersController.remove((await params).id);
