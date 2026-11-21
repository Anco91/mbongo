/**
 * Monthly Budgets Controller
 *
 * Transport layer: validate → delegate → respond.
 *
 * @module Server/MonthlyBudgets/Controller
 */

import { NextResponse } from 'next/server';
import { monthKeySchema, prepareMonthlyBudgetSchema } from '@mbongo/shared';
import {
  parseBody,
  toErrorResponse,
  toSuccessResponse,
} from '@/server/common/http';
import {
  MonthlyBudgetService,
  monthlyBudgetService,
} from './monthly-budget.service';

export class MonthlyBudgetsController {
  constructor(private readonly budgets: MonthlyBudgetService) {}

  /**
   * Find one monthly budget - GET /api/monthly-budgets/{month}
   * Returns 200 with { data: null } if not found (not 404).
   */
  async findOne(month: string): Promise<NextResponse> {
    try {
      const budget = await this.budgets.findOne(month);
      return toSuccessResponse(budget);
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /**
   * Prepare a month - PUT /api/monthly-budgets/{month}
   * Idempotent upsert.
   */
  async prepare(month: string, request: Request): Promise<NextResponse> {
    try {
      // Validate month key
      monthKeySchema.parse(month);

      // Parse optional body (validate but discard - prepare is idempotent)
      await parseBody(request, prepareMonthlyBudgetSchema).catch(() => ({}));

      const budget = await this.budgets.prepare(month);
      return toSuccessResponse(budget);
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

// Singleton pattern
const globalForMonthlyBudgets = globalThis as unknown as {
  monthlyBudgetsController: MonthlyBudgetsController | undefined;
};

export const monthlyBudgetsController =
  globalForMonthlyBudgets.monthlyBudgetsController ??
  new MonthlyBudgetsController(monthlyBudgetService);

if (process.env.NODE_ENV !== 'production') {
  globalForMonthlyBudgets.monthlyBudgetsController = monthlyBudgetsController;
}
