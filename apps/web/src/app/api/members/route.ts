/**
 * Members API Route
 *
 * Route wiring only; request handling lives in MembersController.
 * All requests are delegated to the MembersController.
 *
 * @module API/Members
 */

import { NextResponse } from 'next/server';
import { membersController } from '@/server/members/members.controller';

/**
 * GET /api/members
 * List household members
 */
export const GET = (request: Request): Promise<NextResponse> =>
  membersController.find(request);

/**
 * POST /api/members
 * Create a household member
 */
export const POST = (request: Request): Promise<NextResponse> =>
  membersController.create(request);
