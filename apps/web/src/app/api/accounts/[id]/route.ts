/**
 * Account API Route (Dynamic Segment)
 *
 * Pure wiring for individual account operations.
 * All requests are delegated to the AccountsController.
 *
 * @module API/Accounts/[id]
 */

import { NextResponse } from 'next/server';
import { accountsController } from '@/server/accounts/accounts.controller';

// Type for Next.js dynamic route context
type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/accounts/:id
 * Find an account by ID
 */
export const GET = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => accountsController.findOne((await params).id);

/**
 * PATCH /api/accounts/:id
 * Update an account
 */
export const PATCH = async (
  request: Request,
  { params }: Context
): Promise<NextResponse> =>
  accountsController.update(request, (await params).id);

/**
 * POST /api/accounts/:id/close
 * Close an account (soft delete: status CLOSED + closedAt)
 */
export const POST = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => accountsController.close((await params).id);

/**
 * DELETE /api/accounts/:id
 * Delete an account (only when it has no related data)
 */
export const DELETE = async (
  _request: Request,
  { params }: Context
): Promise<NextResponse> => accountsController.remove((await params).id);
