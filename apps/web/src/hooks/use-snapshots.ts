/**
 * Use Snapshots Hook
 *
 * React Query hook for balance snapshots (bank statements).
 *
 * @module Hooks/UseSnapshots
 */

'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { snapshotQueries } from '@/queries/snapshots';
import type { BalanceSnapshot } from '@mbongo/shared';

/** List balance snapshots (statements). */
export function useSnapshots(): UseQueryResult<BalanceSnapshot[], Error> {
  return useQuery(snapshotQueries.list());
}
