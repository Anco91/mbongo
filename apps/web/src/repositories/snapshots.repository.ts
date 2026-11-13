import {
  snapshotQuerySchema,
  balanceSnapshotSchema,
  createSnapshotSchema,
  type BalanceSnapshot,
  type SnapshotHttp,
  type SnapshotQuery,
  type CreateSnapshotInput,
} from '@mbongo/shared';
import { request } from '@/lib/api';
import { z } from 'zod';

export const snapshotsRepository: SnapshotHttp = {
  async findMany(query: SnapshotQuery = {}): Promise<BalanceSnapshot[]> {
    const snapshots = await request<BalanceSnapshot[]>('GET', '/snapshots', {
      params: snapshotQuerySchema.parse(query),
    });
    return z.array(balanceSnapshotSchema).parse(snapshots);
  },

  async findOne(id: string): Promise<BalanceSnapshot> {
    return balanceSnapshotSchema.parse(
      await request('GET', `/snapshots/${id}`)
    );
  },

  async create(input: CreateSnapshotInput): Promise<BalanceSnapshot> {
    const body = createSnapshotSchema.parse(input);
    return balanceSnapshotSchema.parse(
      await request('POST', '/snapshots', { body })
    );
  },
};
