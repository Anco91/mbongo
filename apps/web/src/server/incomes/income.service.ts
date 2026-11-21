/**
 * Income Service
 *
 * Service layer for income sources CRUD and monthly confirmation.
 * Follows NestJS pattern: business logic isolated from HTTP transport.
 *
 * @module Server/Incomes/Service
 */

import { prisma } from '@/server/db';
import { NotFoundError, HttpError } from '@/server/common/http';
import {
  Income,
  CreateIncomeInput,
  UpdateIncomeInput,
  ConfirmIncomeInput,
  Transaction,
  isIncomeDueForMonth,
} from '@mbongo/shared';
import { parseISO, startOfMonth, endOfMonth } from 'date-fns';

/** Normalized query type for the service (boolean active, not string). */
interface IncomeServiceQuery {
  month?: string;
  active?: boolean;
  accountId?: string;
  limit?: number;
}

export class IncomeService {
  /**
   * Find incomes with optional filters.
   */
  async findMany(query: IncomeServiceQuery = {}): Promise<Income[]> {
    const where: Record<string, unknown> = {};

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (query.accountId) {
      where.accountId = query.accountId;
    }

    if (query.month) {
      // Filter incomes due for the given month
      const month = query.month;
      const allIncomes = await prisma.income.findMany({ where });
      return allIncomes
        .filter((income) => isIncomeDueForMonth(this.toIncome(income), month))
        .map((income) => this.toIncome(income));
    }

    const rows = await prisma.income.findMany({
      where,
      orderBy: { startDate: 'desc' },
      take: query.limit ?? 100,
    });

    return rows.map((row) => this.toIncome(row));
  }

  /**
   * Find one income by ID.
   */
  async findOne(id: string): Promise<Income> {
    const row = await prisma.income.findUnique({ where: { id } });
    if (!row) throw new NotFoundError('Income', id);
    return this.toIncome(row);
  }

  /**
   * Create a new income source.
   */
  async create(input: CreateIncomeInput): Promise<Income> {
    const account = await prisma.account.findUnique({
      where: { id: input.accountId },
    });
    if (!account) {
      throw new HttpError(422, {
        message: `Unknown account: ${input.accountId}`,
      });
    }

    const row = await prisma.income.create({
      data: {
        label: input.label,
        amount: input.amount,
        currency: input.currency,
        accountId: input.accountId,
        memberId: input.memberId !== undefined ? input.memberId : null,
        frequency: input.frequency,
        startDate: parseISO(input.startDate),
        endDate:
          input.endDate !== undefined && input.endDate
            ? parseISO(input.endDate)
            : null,
        active: input.active ?? true,
      },
    });

    return this.toIncome(row);
  }

  /**
   * Update an income source.
   */
  async update(id: string, input: UpdateIncomeInput): Promise<Income> {
    const existing = await prisma.income.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Income', id);

    const row = await prisma.income.update({
      where: { id },
      data: {
        label: input.label,
        amount: input.amount,
        currency: input.currency,
        accountId: input.accountId,
        memberId: input.memberId,
        frequency: input.frequency,
        startDate: input.startDate ? parseISO(input.startDate) : undefined,
        endDate:
          input.endDate !== undefined
            ? input.endDate
              ? parseISO(input.endDate)
              : null
            : undefined,
        active: input.active,
      },
    });

    return this.toIncome(row);
  }

  /**
   * Remove an income source.
   * Transactions are kept with incomeId set to null (onDelete: SetNull).
   */
  async remove(id: string): Promise<void> {
    const existing = await prisma.income.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Income', id);

    await prisma.income.delete({ where: { id } });
  }

  /**
   * Confirm income for a month (idempotent upsert).
   * Creates or updates a positive transaction linked to the income.
   */
  async confirm(id: string, input: ConfirmIncomeInput): Promise<Transaction> {
    const income = await prisma.income.findUnique({ where: { id } });
    if (!income) throw new NotFoundError('Income', id);

    if (!income.active) {
      throw new HttpError(422, {
        message: 'Cannot confirm an inactive income source',
      });
    }

    // Validate date is within the month
    const [yearStr, monthStr] = input.month.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(new Date(year, month - 1, 1));

    const txDate = input.date
      ? parseISO(input.date)
      : new Date(year, month - 1, 1, 12, 0, 0);

    if (txDate < monthStart || txDate > monthEnd) {
      throw new HttpError(422, {
        message: `Date must be within ${input.month}`,
      });
    }

    // Upsert transaction (idempotent)
    const row = await prisma.transaction.upsert({
      where: {
        incomeId_budgetMonth: {
          incomeId: id,
          budgetMonth: input.month,
        },
      },
      update: {
        amount: input.amount,
        date: txDate,
      },
      create: {
        accountId: income.accountId,
        date: txDate,
        amount: input.amount,
        category: 'SALAIRE',
        note: `${income.label} — ${input.month}`,
        incomeId: id,
        budgetMonth: input.month,
      },
    });

    return this.toTransaction(row);
  }

  private toIncome(row: {
    id: string;
    label: string;
    amount: number;
    currency: string;
    accountId: string;
    memberId: string | null;
    frequency: string;
    startDate: Date;
    endDate: Date | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Income {
    return {
      id: row.id,
      label: row.label,
      amount: row.amount,
      currency: row.currency as 'CHF' | 'EUR',
      accountId: row.accountId,
      memberId: row.memberId,
      frequency: row.frequency as 'monthly' | 'yearly',
      startDate: row.startDate.toISOString(),
      endDate: row.endDate ? row.endDate.toISOString() : null,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toTransaction(row: {
    id: string;
    accountId: string;
    date: Date;
    amount: number;
    category: string | null;
    note: string | null;
    transferId: string | null;
    transferRole: string | null;
    incomeId: string | null;
    budgetMonth: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Transaction {
    return {
      id: row.id,
      accountId: row.accountId,
      date: row.date.toISOString(),
      amount: row.amount,
      category: row.category,
      note: row.note,
      transferId: row.transferId,
      transferRole: row.transferRole as 'SOURCE' | 'TARGET' | null,
      incomeId: row.incomeId,
      budgetMonth: row.budgetMonth,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

// Singleton pattern
const globalForIncome = globalThis as unknown as {
  incomeService: IncomeService | undefined;
};

export const incomeService =
  globalForIncome.incomeService ?? new IncomeService();

if (process.env.NODE_ENV !== 'production') {
  globalForIncome.incomeService = incomeService;
}
