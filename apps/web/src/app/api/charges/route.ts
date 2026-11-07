/**
 * Charges API Route
 *
 * Pure wiring (the main.ts role in Nest): no logic lives here.
 * All requests are delegated to the ChargesController.
 *
 * @module API/Charges
 */

import { chargesController } from '@/server/charges/charges.controller';

/**
 * GET /api/charges
 * Find charges with optional filtering and pagination
 */
export const GET = (request: Request) => chargesController.find(request);

/**
 * POST /api/charges
 * Create a charge
 */
export const POST = (request: Request) => chargesController.create(request);
