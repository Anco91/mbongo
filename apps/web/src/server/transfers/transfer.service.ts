import 'server-only';
import { prisma } from '@/server/db';
import { NotFoundError, HttpError } from '@/server/common/http';
import { createWhereTranslator } from '@/server/common/where-translator';
import {
  Transfer,
  TransferQuery,
  CreateTransferInput,
  UpdateTransferInput,
  counterValue,
  effectiveRate,
  transferFees,
  checkTransferAccounts,
  isSameCurrencyTransfer,
  settleSameCurrencyTransfer,
  type TransferAccountRef,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';

const transferWhereTranslator =
  createWhereTranslator<Prisma.TransferWhereInput>({
    status: { ops: ['eq', 'in'] },
    sourceAccountId: { ops: ['eq', 'in'] },
    targetAccountId: { ops: ['eq', 'in'] },
  });

export class TransferService {
  async findMany(query: TransferQuery): Promise<Transfer[]> {
    const rows = await prisma.transfer.findMany({
      where: transferWhereTranslator(query as Record<string, unknown>),
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
    const srcRef = src as TransferAccountRef;
    const tgtRef = tgt as TransferAccountRef;
    const refusal = checkTransferAccounts(srcRef, tgtRef);
    if (refusal) throw new HttpError(422, refusal);

    const sameCurrency = isSameCurrencyTransfer(srcRef, tgtRef);
    const settlement = sameCurrency
      ? settleSameCurrencyTransfer(input.amountSent)
      : null;
    const sentAt = parseISO(input.sentAt);

    const transfer = await prisma.$transaction(async (tx) => {
      const created = await tx.transfer.create({
        data: {
          sourceAccountId: input.sourceAccountId,
          targetAccountId: input.targetAccountId,
          amountSent: input.amountSent,
          rateEstimated: settlement?.rateEstimated ?? input.rateEstimated,
          rateDate: parseISO(input.rateDate),
          memo: input.memo ?? null,
          status: settlement ? 'COMPLETED' : 'ESTIMATED',
          sentAt,
          ...(settlement && {
            amountReceived: settlement.amountReceived,
            receivedAt: sentAt,
            rateEffective: settlement.rateEffective,
            fees: settlement.fees,
          }),
        },
      });
      await tx.transaction.create({
        data: {
          accountId: input.sourceAccountId,
          date: sentAt,
          amount: -input.amountSent,
          transferId: created.id,
          transferRole: 'SOURCE',
        },
      });
      if (settlement) {
        await tx.transaction.create({
          data: {
            accountId: input.targetAccountId,
            date: sentAt,
            amount: settlement.amountReceived,
            transferId: created.id,
            transferRole: 'TARGET',
          },
        });
      }
      return created;
    });

    return this.toTransfer(transfer);
  }

  async update(id: string, input: UpdateTransferInput): Promise<Transfer> {
    const existing = await prisma.transfer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Transfer', id);
    if (existing.status === 'CLOSED') {
      throw new HttpError(409, 'Transfer is closed');
    }
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

  /** Close a transfer from any state; idempotent, never touches transactions. */
  async close(id: string): Promise<Transfer> {
    const existing = await prisma.transfer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Transfer', id);
    if (existing.status === 'CLOSED') return this.toTransfer(existing);
    const closed = await prisma.transfer.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    return this.toTransfer(closed);
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
