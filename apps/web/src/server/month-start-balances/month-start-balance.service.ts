/**
 * Month Start Balance Service
 *
 * Persisted logical start balance per (month, account).
 *
 * @module Server/MonthStartBalances/Service
 */

import { prisma } from '@/server/db';
import { NotFoundError } from '@/server/common/http';
import type {
  MonthStartBalance,
  SaveMonthStartBalancesInput,
} from '@mbongo/shared';

interface MonthStartBalanceRow {
  month: string;
  accountId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export class MonthStartBalanceService {
  /** Rows of a month; empty when nothing is saved. */
  async findByMonth(month: string): Promise<MonthStartBalance[]> {
    const rows = await prisma.monthStartBalance.findMany({
      where: { month },
      orderBy: { accountId: 'asc' },
    });
    return rows.map((row) => this.toMonthStartBalance(row));
  }

  /** Idempotent upsert of the given accounts; returns the month's rows. */
  async save(
    month: string,
    input: SaveMonthStartBalancesInput
  ): Promise<MonthStartBalance[]> {
    const ids = input.balances.map((b) => b.accountId);
    const found = await prisma.account.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const known = new Set(found.map((a) => a.id));
    const missing = ids.find((id) => !known.has(id));
    if (missing !== undefined) {
      throw new NotFoundError('Account', missing);
    }

    await prisma.$transaction(
      input.balances.map(({ accountId, balance }) =>
        prisma.monthStartBalance.upsert({
          where: { month_accountId: { month, accountId } },
          update: { balance },
          create: { month, accountId, balance },
        })
      )
    );
    return this.findByMonth(month);
  }

  private toMonthStartBalance(row: MonthStartBalanceRow): MonthStartBalance {
    return {
      month: row.month,
      accountId: row.accountId,
      balance: row.balance,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

// Singleton pattern
const globalForMonthStartBalance = globalThis as unknown as {
  monthStartBalanceService: MonthStartBalanceService | undefined;
};

export const monthStartBalanceService =
  globalForMonthStartBalance.monthStartBalanceService ??
  new MonthStartBalanceService();

if (process.env.NODE_ENV !== 'production') {
  globalForMonthStartBalance.monthStartBalanceService =
    monthStartBalanceService;
}
