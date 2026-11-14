import 'server-only';
import { prisma } from '@/server/db';
import { NotFoundError, HttpError } from '@/server/common/http';
import { transactionQueryToWhere } from '@/server/common/filter-to-where';
import {
  Transaction,
  TransactionQuery,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';

export class TransactionService {
  async findMany(query: TransactionQuery): Promise<Transaction[]> {
    const rows = await prisma.transaction.findMany({
      where: transactionQueryToWhere(query),
      orderBy: { date: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });
    return rows.map((row) => this.toTransaction(row));
  }

  async findOne(id: string): Promise<Transaction> {
    const row = await prisma.transaction.findUnique({ where: { id } });
    if (!row) throw new NotFoundError('Transaction', id);
    return this.toTransaction(row);
  }

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const row = await prisma.transaction.create({
      data: {
        accountId: input.accountId,
        date: parseISO(input.date),
        amount: input.amount,
        category: input.category ?? null,
        note: input.note ?? null,
        transferId: input.transferId ?? null,
        transferRole: input.transferRole ?? null,
      },
    });
    return this.toTransaction(row);
  }

  async update(
    id: string,
    input: UpdateTransactionInput
  ): Promise<Transaction> {
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Transaction', id);
    const row = await prisma.transaction.update({
      where: { id },
      data: this.toPrisma(input),
    });
    return this.toTransaction(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Transaction', id);
    if (existing.transferId !== null) {
      throw new HttpError(
        409,
        'Transaction is linked to a transfer and cannot be deleted'
      );
    }
    // M2 (spec payment-schedule) : une transaction rapprochée supprimée
    // dérapproche automatiquement son échéance — retour PENDING, sans date
    // de paiement. Aucune échéance PAID ne reste orpheline.
    await prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: { transactionId: id },
        data: { transactionId: null, status: 'PENDING', paidAt: null },
      });
      await tx.transaction.delete({ where: { id } });
    });
  }

  private toPrisma(
    input: UpdateTransactionInput
  ): Prisma.TransactionUncheckedUpdateInput {
    const data: Prisma.TransactionUncheckedUpdateInput = {};
    if (input.accountId !== undefined) data.accountId = input.accountId;
    if (input.date !== undefined) data.date = parseISO(input.date);
    if (input.amount !== undefined) data.amount = input.amount;
    if (input.category !== undefined) data.category = input.category;
    if (input.note !== undefined) data.note = input.note;
    if (input.transferId !== undefined) data.transferId = input.transferId;
    if (input.transferRole !== undefined)
      data.transferRole = input.transferRole;
    return data;
  }

  private toTransaction(
    row: Prisma.TransactionGetPayload<object>
  ): Transaction {
    return {
      ...row,
      transferRole: row.transferRole as Transaction['transferRole'],
      date: row.date.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

const globalForTransactionService = globalThis as {
  transactionService?: TransactionService;
};
export const transactionService =
  globalForTransactionService.transactionService ?? new TransactionService();

if (process.env.NODE_ENV !== 'production') {
  globalForTransactionService.transactionService = transactionService;
}
