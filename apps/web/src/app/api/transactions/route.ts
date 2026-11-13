/**
 * Transactions API Route
 *
 * Pure wiring (the main.ts role in Nest): no logic lives here.
 * All requests are delegated to the TransactionsController.
 *
 * @module API/Transactions
 */

import { NextResponse } from 'next/server';
import { transactionsController } from '@/server/transactions/transactions.controller';

/**
 * GET /api/transactions
 * Find transactions with optional filtering and pagination
 */
export const GET = (request: Request): Promise<NextResponse> =>
  transactionsController.find(request);
