/**
 * Incomes Controller
 *
 * Transport layer: validate → delegate → respond.
 * Route files are pure wiring over this class.
 *
 * @module Server/Incomes/Controller
 */

import { NextResponse } from 'next/server';
import {
  incomeQuerySchema,
  createIncomeSchema,
  updateIncomeSchema,
  confirmIncomeSchema,
} from '@mbongo/shared';
import {
  parseBody,
  parseQuery,
  toErrorResponse,
  toSuccessResponse,
  toCreatedResponse,
  toNoContentResponse,
} from '@/server/common/http';
import { IncomeService, incomeService } from './income.service';

export class IncomesController {
  constructor(private readonly incomes: IncomeService) {}

  /**
   * Find incomes - GET /api/incomes
   */
  async find(request: Request): Promise<NextResponse> {
    try {
      const query = parseQuery(request, incomeQuerySchema);
      // Normalize active field from string to boolean
      const normalizedQuery = {
        ...query,
        active:
          query.active === 'true'
            ? true
            : query.active === 'false'
              ? false
              : undefined,
      };
      const incomes = await this.incomes.findMany(normalizedQuery);
      return toSuccessResponse(incomes);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Create income - POST /api/incomes
   */
  async create(request: Request): Promise<NextResponse> {
    try {
      const body = await parseBody(request, createIncomeSchema);
      // Normalize optional fields to avoid undefined
      const normalizedInput = {
        ...body,
        memberId: body.memberId ?? null,
        endDate: body.endDate ?? null,
        active: body.active ?? true,
      };
      const income = await this.incomes.create(normalizedInput);
      return toCreatedResponse(income);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Update income - PATCH /api/incomes/{id}
   */
  async update(id: string, request: Request): Promise<NextResponse> {
    try {
      const body = await parseBody(request, updateIncomeSchema);
      const income = await this.incomes.update(id, body);
      return toSuccessResponse(income);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Remove income - DELETE /api/incomes/{id}
   */
  async remove(id: string): Promise<NextResponse> {
    try {
      await this.incomes.remove(id);
      return toNoContentResponse();
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Confirm income for a month - POST /api/incomes/{id}/confirm
   * Idempotent upsert: returns 200, not 201.
   */
  async confirm(id: string, request: Request): Promise<NextResponse> {
    try {
      const body = await parseBody(request, confirmIncomeSchema);
      const transaction = await this.incomes.confirm(id, body);
      return toSuccessResponse(transaction);
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

// Singleton pattern
const globalForIncomes = globalThis as unknown as {
  incomesController: IncomesController | undefined;
};

export const incomesController =
  globalForIncomes.incomesController ?? new IncomesController(incomeService);

if (process.env.NODE_ENV !== 'production') {
  globalForIncomes.incomesController = incomesController;
}
