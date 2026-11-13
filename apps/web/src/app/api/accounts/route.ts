/**
 * Accounts API Route
 *
 * Pure wiring (the main.ts role in Nest): no logic lives here.
 * All requests are delegated to the AccountsController.
 *
 * @module API/Accounts
 */

import { NextResponse } from 'next/server';
import { accountsController } from '@/server/accounts/accounts.controller';

/**
 * GET /api/accounts
 * Find accounts with optional filtering and pagination
 */
export const GET = (request: Request): Promise<NextResponse> =>
  accountsController.find(request);

/**
 * POST /api/accounts
 * Create an account
 */
export const POST = (request: Request): Promise<NextResponse> =>
  accountsController.create(request);
