/**
 * Use Transfers Hook
 *
 * React Query hooks for the 2-phase transfer workflow:
 * - `useCreateTransfer` — phase 1 (ESTIMATED, debit transaction created)
 * - `useCompleteTransfer` — phase 2 (COMPLETED, credit transaction created)
 *
 * Domain hooks only — components never call the API directly (R8).
 *
 * @module Components/Transfers/Hooks/UseTransfers
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { transfersRepository } from '@/repositories/transfers.repository';
import { transferQueries } from '@/queries/transfers';
import type {
  Transfer,
  TransferQuery,
  CreateTransferInput,
  UpdateTransferInput,
} from '@mbongo/shared';

/**
 * List transfers (newest first by default).
 */
export function useTransfers(
  query: TransferQuery = {}
): UseQueryResult<Transfer[], Error> {
  return useQuery(transferQueries.list(query));
}

/**
 * Create a transfer (phase 1 — estimated), then refresh the list.
 */
export function useCreateTransfer(): UseMutationResult<
  Transfer,
  Error,
  CreateTransferInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransferInput) =>
      transfersRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transferQueries.all() });
    },
  });
}

/**
 * Complete a transfer (phase 2 — received amount), then refresh the list.
 * Rejects with 409 when the transfer is already COMPLETED.
 */
export function useCompleteTransfer(): UseMutationResult<
  Transfer,
  Error,
  { id: string; input: UpdateTransferInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTransferInput }) =>
      transfersRepository.completeTransfer(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transferQueries.all() });
    },
  });
}

/**
 * Close a transfer (archive it from any state), then refresh the list.
 */
export function useCloseTransfer(): UseMutationResult<Transfer, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transfersRepository.closeTransfer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transferQueries.all() });
    },
  });
}
