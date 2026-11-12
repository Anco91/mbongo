import 'server-only';
import { prisma } from '@/server/db';
import { NotFoundError } from '@/server/common/http';
import { snapshotQueryToWhere } from '@/server/common/filter-to-where';
import { BalanceSnapshot, SnapshotQuery, CreateSnapshotInput } from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';

export class SnapshotService {
  async findMany(query: SnapshotQuery): Promise<BalanceSnapshot[]> {
    const rows = await prisma.balanceSnapshot.findMany({
      where: snapshotQueryToWhere(query),
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
