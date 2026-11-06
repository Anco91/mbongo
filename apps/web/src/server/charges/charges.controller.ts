/**
 * Charges Controller
 *
 * Transport layer: validate → delegate → respond.
 * Route files are pure wiring over this class.
 * This is the NestJS-like controller that handles HTTP requests.
 *
 * @module Server/Charges/Controller
 */

import { NextResponse } from 'next/server';
import {
  chargeQuerySchema,
  createChargeSchema,
  updateChargeSchema,
} from '@mbongo/shared';
import {
  parseBody,
  parseQuery,
  toErrorResponse,
  toSuccessResponse,
  toCreatedResponse,
  toNoContentResponse,
} from '@/server/common/http';
import { ChargeService, chargeService } from './charge.service';

/**
 * Charges Controller
 *
 * This controller handles all HTTP requests for the /api/charges endpoint.
 * It follows the NestJS pattern:
 * - Validation at the boundary (using Zod)
 * - Delegation to the service layer
 * - Response formatting
 *
 * @example
 * ```typescript
 * const controller = new ChargesController(chargeService);
 *
 * // In route.ts:
 * export const GET = (request: Request) => controller.find(request);
 * ```
 */
export class ChargesController {
  constructor(private readonly charges: ChargeService) {}

  /**
   * Find charges - GET /api/charges
   *
   * Validates query parameters and delegates to the service.
   *
   * @param request - Next.js Request object
   * @returns NextResponse with array of charges or error
   *
   * @example
   * ```typescript
   * // GET /api/charges?type[eq]=FIXED_RECURRING&limit=50
   * const response = await controller.find(request);
   * ```
   */
  async find(request: Request): Promise<NextResponse> {
    try {
      // Parse and validate query parameters
      const query = parseQuery(request, chargeQuerySchema);

      // Delegate to service
      const charges = await this.charges.findMany(query);

      // Return success response
      return toSuccessResponse(charges);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Create charge - POST /api/charges
   *
   * Validates request body and delegates to the service.
   * Creates a charge; scheduled payments use the Payment resource.
   *
   * @param request - Next.js Request object with JSON body
   * @returns NextResponse with created charge (201) or error
   *
   * @example
   * ```typescript
   * // POST /api/charges
   * // Body: { label: 'Loyer', type: 'FIXED_RECURRING', amount: 1000, ... }
   * const response = await controller.create(request);
   * ```
   */
  async create(request: Request): Promise<NextResponse> {
    try {
      // Parse and validate request body
      const input = await parseBody(request, createChargeSchema);

      // Delegate to the charge CRUD service
      const charge = await this.charges.create(input);

      // Return created response (201)
      return toCreatedResponse(charge);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Find charge by ID - GET /api/charges/:id
   *
   * @param id - Charge ID (UUID)
   * @returns NextResponse with charge or error (404 if not found)
   *
   * @example
   * ```typescript
   * // GET /api/charges/abc123
   * const response = await controller.findOne('abc123');
   * ```
   */
  async findOne(id: string): Promise<NextResponse> {
    try {
      const charge = await this.charges.findOne(id);
      return toSuccessResponse(charge);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Update charge - PATCH /api/charges/:id
   *
   * @param request - Next.js Request object with JSON body
   * @param id - Charge ID to update
   * @returns NextResponse with updated charge or error
   *
   * @example
   * ```typescript
   * // PATCH /api/charges/abc123
   * // Body: { label: 'New Label' }
   * const response = await controller.update(request, 'abc123');
   * ```
   */
  async update(request: Request, id: string): Promise<NextResponse> {
    try {
      // Parse and validate request body (partial update)
      const input = await parseBody(request, updateChargeSchema);

      // Delegate to service
      const charge = await this.charges.update(id, input);

      return toSuccessResponse(charge);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Delete charge - DELETE /api/charges/:id
   *
   * @param id - Charge ID to delete
   * @returns NextResponse with no content (204) or error
   *
   * @example
   * ```typescript
   * // DELETE /api/charges/abc123
   * const response = await controller.remove('abc123');
   * ```
   */
  async remove(id: string): Promise<NextResponse> {
    try {
      await this.charges.remove(id);
      return toNoContentResponse();
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const globalForChargesController = globalThis as unknown as {
  chargesController?: ChargesController;
};

/**
 * Singleton instance of ChargesController
 *
 * Usage in route files:
 * ```typescript
 * import { chargesController } from '@/server/charges/charges.controller';
 *
 * export const GET = (request: Request) => chargesController.find(request);
 * export const POST = (request: Request) => chargesController.create(request);
 * ```
 */
export const chargesController =
  globalForChargesController.chargesController ??
  new ChargesController(chargeService);

// Cache the instance in development for HMR
if (process.env.NODE_ENV !== 'production') {
  globalForChargesController.chargesController = chargesController;
}
