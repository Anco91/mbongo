import 'server-only';
import { prisma } from '@/server/db';
import { NotFoundError, HttpError } from '@/server/common/http';
import { transferQueryToWhere } from '@/server/common/filter-to-where';
import {
  Transfer,
  TransferQuery,
  CreateTransferInput,
  UpdateTransferInput,
  counterValue,
  effectiveRate,
  transferFees,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';

export class TransferService {
  async findMany(query: TransferQuery): Promise<Transfer[]> {
    const rows = await prisma.transfer.findMany({
      where: transferQueryToWhere(query),
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });
    return rows.map((row) => this.toTransfer(row));
  }

  async findOne(id: string): Promise<Transfer> {
    const row = await prisma.transfer.findUnique({ where: { id } });
    if (!row) throw new NotFoundError('Transfer', id);
    return this.toTransfer(row);
  }

  async create(input: CreateTransferInput): Promise<Transfer> {
    const [src, tgt] = await Promise.all([
      prisma.account.findUnique({ where: { id: input.sourceAccountId } }),
      prisma.account.findUnique({ where: { id: input.targetAccountId } }),
    ]);
    if (!src) throw new NotFoundError('Account', input.sourceAccountId);
    if (!tgt) throw new NotFoundError('Account', input.targetAccountId);
    if (src.currency !== 'CHF' || tgt.currency !== 'EUR') {
      throw new HttpError(
        422,
        'Transfer requires a CHF source account and an EUR target account'
      );
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const created = await tx.transfer.create({
        data: {
          sourceAccountId: input.sourceAccountId,
          targetAccountId: input.targetAccountId,
          amountSent: input.amountSent,
          rateEstimated: input.rateEstimated,
          rateDate: parseISO(input.rateDate),
          memo: input.memo ?? null,
          status: 'ESTIMATED',
          sentAt: parseISO(input.sentAt),
        },
      });
      await tx.transaction.create({
        data: {
          accountId: input.sourceAccountId,
          date: parseISO(input.sentAt),
          amount: -input.amountSent,
          transferId: created.id,
          transferRole: 'SOURCE',
        },
      });
      return created;
    });

    return this.toTransfer(transfer);
  }

  async update(id: string, input: UpdateTransferInput): Promise<Transfer> {
    const existing = await prisma.transfer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Transfer', id);
    if (existing.status === 'COMPLETED') {
      throw new HttpError(409, 'Transfer is already completed');
    }

    const estimated = counterValue(existing.amountSent, existing.rateEstimated);
    const rateEff = effectiveRate(input.amountReceived, existing.amountSent);
    const fees = transferFees(estimated, input.amountReceived);

    const transfer = await prisma.$transaction(async (tx) => {
      const updated = await tx.transfer.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          amountReceived: input.amountReceived,
          receivedAt: parseISO(input.receivedAt),
          rateEffective: rateEff,
          fees,
        },
      });
      await tx.transaction.create({
        data: {
          accountId: existing.targetAccountId,
          date: parseISO(input.receivedAt),
          amount: input.amountReceived,
          transferId: id,
          transferRole: 'TARGET',
        },
      });
      return updated;
    });

    return this.toTransfer(transfer);
  }

  private toTransfer(row: Prisma.TransferGetPayload<object>): Transfer {
    return {
      ...row,
      status: row.status as Transfer['status'],
      rateDate: row.rateDate.toISOString(),
      sentAt: row.sentAt.toISOString(),
      receivedAt: row.receivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

const globalForTransferService = globalThis as {
  transferService?: TransferService;
};
export const transferService =
  globalForTransferService.transferService ?? new TransferService();

if (process.env.NODE_ENV !== 'production') {
  globalForTransferService.transferService = transferService;
}
