/**
 * Snapshot Queries
 *
 * Query factory for balance snapshots (bank statements): the only source of
 * their query keys and `queryOptions`.
 *
 * @module Queries/Snapshots
 */

import { queryOptions } from '@tanstack/react-query';
import { snapshotsRepository } from '@/repositories/snapshots.repository';
import type { SnapshotQuery } from '@mbongo/shared';

const KEY = 'snapshots' as const;

export const snapshotQueries = {
  all: () => [KEY] as const,
  list: (query: SnapshotQuery = {}) =>
    queryOptions({
      queryKey: [KEY, query] as const,
      queryFn: () => snapshotsRepository.findMany(query),
    }),
};
