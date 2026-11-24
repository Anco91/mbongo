/**
 * Use Incomes Hook
 *
 * React Query hooks for managing income sources.
 *
 * @module Hooks/UseIncomes
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { incomesRepository } from '@/repositories/incomes.repository';
import { incomeQueries } from '@/queries/incomes';
import { transactionQueries } from '@/queries/transactions';
import {
  Income,
  CreateIncomeInput,
  UpdateIncomeInput,
  ConfirmIncomeInput,
  IncomeQuery,
  Transaction,
} from '@mbongo/shared';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get incomes for a month or all incomes.
 */
export function useIncomes(
  query: IncomeQuery = {}
): UseQueryResult<Income[], Error> {
  return useQuery(incomeQueries.list(query));
}

/**
 * Get a single income by ID.
 */
export function useIncome(id: string): UseQueryResult<Income, Error> {
  return useQuery(incomeQueries.detail(id));
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new income source.
 */
export function useCreateIncome(): UseMutationResult<
  Income,
  Error,
  CreateIncomeInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input) => incomesRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incomeQueries.all() });
      void queryClient.invalidateQueries({
        queryKey: transactionQueries.all(),
      });
    },
  });
}

/**
 * Update an income source.
 */
export function useUpdateIncome(): UseMutationResult<
  Income,
  Error,
  { id: string; input: UpdateIncomeInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => incomesRepository.update(id, input),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: incomeQueries.all() });
      void queryClient.invalidateQueries({
        queryKey: incomeQueries.detail(id).queryKey,
      });
    },
  });
}

/**
 * Delete an income source.
 */
export function useDeleteIncome(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => incomesRepository.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: incomeQueries.all() });
      void queryClient.invalidateQueries({
        queryKey: transactionQueries.all(),
      });
    },
  });
}

/**
 * Confirm income for a month (idempotent upsert).
 */
export function useConfirmIncome(): UseMutationResult<
  Transaction,
  Error,
  { id: string; input: ConfirmIncomeInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => incomesRepository.confirm(id, input),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: transactionQueries.all(),
      });
      void queryClient.invalidateQueries({
        queryKey: incomeQueries.detail(id).queryKey,
      });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
