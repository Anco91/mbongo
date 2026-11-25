/**
 * Use Snapshots Hook
 *
 * React Query hook for balance snapshots (bank statements).
 *
 * @module Hooks/UseSnapshots
 */

'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { snapshotsRepository } from '@/repositories/snapshots.repository';
import { snapshotQueries } from '@/queries/snapshots';
import type { BalanceSnapshot, CreateSnapshotInput } from '@mbongo/shared';

/** List balance snapshots (statements). */
export function useSnapshots(): UseQueryResult<BalanceSnapshot[], Error> {
  return useQuery(snapshotQueries.list());
}

/** Create a snapshot (statement balance), then refresh the snapshots. */
export function useCreateSnapshot(): UseMutationResult<
  BalanceSnapshot,
  Error,
  CreateSnapshotInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSnapshotInput) =>
      snapshotsRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: snapshotQueries.all() });
    },
  });
}
