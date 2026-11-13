/**
 * Members API Route
 *
 * Pure wiring (the main.ts role in Nest): no logic lives here.
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
