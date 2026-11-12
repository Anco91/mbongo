import type {
  BalanceSnapshot,
  SnapshotQuery,
  CreateSnapshotInput,
} from '../schemas/snapshot';

export interface SnapshotHttp {
  findMany(query?: SnapshotQuery): Promise<BalanceSnapshot[]>;
  findOne(id: string): Promise<BalanceSnapshot>;
  create(input: CreateSnapshotInput): Promise<BalanceSnapshot>;
}
