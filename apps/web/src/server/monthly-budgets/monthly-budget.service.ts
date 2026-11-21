/**
 * Monthly Budget Service
 *
 * Service layer for monthly budget state management.
 *
 * @module Server/MonthlyBudgets/Service
 */

import { prisma } from '@/server/db';
import { MonthlyBudget } from '@mbongo/shared';

export class MonthlyBudgetService {
  /**
   * Find one monthly budget by month key.
   * Returns null if the month has never been prepared.
   */
  async findOne(month: string): Promise<MonthlyBudget | null> {
    const row = await prisma.monthlyBudget.findUnique({
      where: { month },
    });
    return row ? this.toMonthlyBudget(row) : null;
  }

  /**
   * Prepare a month (idempotent upsert).
   * Marks the month as prepared with the current timestamp.
   */
  async prepare(month: string): Promise<MonthlyBudget> {
    const row = await prisma.monthlyBudget.upsert({
      where: { month },
      update: { preparedAt: new Date() },
      create: { month, preparedAt: new Date() },
    });
    return this.toMonthlyBudget(row);
  }

  private toMonthlyBudget(row: {
    id: string;
    month: string;
    preparedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): MonthlyBudget {
    return {
      month: row.month,
      preparedAt: row.preparedAt ? row.preparedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

// Singleton pattern
const globalForMonthlyBudget = globalThis as unknown as {
  monthlyBudgetService: MonthlyBudgetService | undefined;
};

export const monthlyBudgetService =
  globalForMonthlyBudget.monthlyBudgetService ?? new MonthlyBudgetService();

if (process.env.NODE_ENV !== 'production') {
  globalForMonthlyBudget.monthlyBudgetService = monthlyBudgetService;
}
