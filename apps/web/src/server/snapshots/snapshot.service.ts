import 'server-only';
import { prisma } from '@/server/db';
import { NotFoundError, HttpError } from '@/server/common/http';
import { createWhereTranslator } from '@/server/common/where-translator';
import {
  BalanceSnapshot,
  SnapshotQuery,
  CreateSnapshotInput,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';

const snapshotWhereTranslator =
  createWhereTranslator<Prisma.BalanceSnapshotWhereInput>({
    accountId: { ops: ['eq', 'in'] },
    date: {
      ops: ['eq', 'gte', 'lte', 'gt', 'lt'],
      transform: (v) => (typeof v === 'string' ? parseISO(v) : v),
    },
  });

export class SnapshotService {
  async findMany(query: SnapshotQuery): Promise<BalanceSnapshot[]> {
    const rows = await prisma.balanceSnapshot.findMany({
      where: snapshotWhereTranslator(query as Record<string, unknown>),
      orderBy: { date: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });
    return rows.map((row) => this.toSnapshot(row));
  }

  async findOne(id: string): Promise<BalanceSnapshot> {
    const row = await prisma.balanceSnapshot.findUnique({ where: { id } });
    if (!row) throw new NotFoundError('BalanceSnapshot', id);
    return this.toSnapshot(row);
  }

  // No adjustment transaction — snapshot only
  async create(input: CreateSnapshotInput): Promise<BalanceSnapshot> {
    const account = await prisma.account.findUnique({
      where: { id: input.accountId },
    });
    if (!account) {
      throw new HttpError(422, {
        message: `Unknown account: ${input.accountId}`,
      });
    }
    const row = await prisma.balanceSnapshot.create({
      data: {
        accountId: input.accountId,
        date: parseISO(input.date),
        balance: input.balance,
        note: input.note ?? null,
      },
    });
    return this.toSnapshot(row);
  }

  private toSnapshot(
    row: Prisma.BalanceSnapshotGetPayload<object>
  ): BalanceSnapshot {
    return {
      ...row,
      date: row.date.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

const globalForSnapshotService = globalThis as {
  snapshotService?: SnapshotService;
};
export const snapshotService =
  globalForSnapshotService.snapshotService ?? new SnapshotService();

if (process.env.NODE_ENV !== 'production') {
  globalForSnapshotService.snapshotService = snapshotService;
}
