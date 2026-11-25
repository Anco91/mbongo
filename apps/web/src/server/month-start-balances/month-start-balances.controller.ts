/**
 * Month Start Balances Controller
 *
 * Transport layer: validate → delegate → respond.
 *
 * @module Server/MonthStartBalances/Controller
 */

import { NextResponse } from 'next/server';
import { monthKeySchema, saveMonthStartBalancesSchema } from '@mbongo/shared';
import {
  parseBody,
  toErrorResponse,
  toSuccessResponse,
} from '@/server/common/http';
import {
  MonthStartBalanceService,
  monthStartBalanceService,
} from './month-start-balance.service';

export class MonthStartBalancesController {
  constructor(private readonly balances: MonthStartBalanceService) {}

  /** GET /api/month-start-balances/{month} — [] when nothing is saved. */
  async findByMonth(month: string): Promise<NextResponse> {
    try {
      monthKeySchema.parse(month);
      return toSuccessResponse(await this.balances.findByMonth(month));
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /** PUT /api/month-start-balances/{month} — idempotent upsert. */
  async save(month: string, request: Request): Promise<NextResponse> {
    try {
      monthKeySchema.parse(month);
      const input = await parseBody(request, saveMonthStartBalancesSchema);
      return toSuccessResponse(await this.balances.save(month, input));
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

// Singleton pattern
const globalForMonthStartBalances = globalThis as unknown as {
  monthStartBalancesController: MonthStartBalancesController | undefined;
};

export const monthStartBalancesController =
  globalForMonthStartBalances.monthStartBalancesController ??
  new MonthStartBalancesController(monthStartBalanceService);

if (process.env.NODE_ENV !== 'production') {
  globalForMonthStartBalances.monthStartBalancesController =
    monthStartBalancesController;
}
