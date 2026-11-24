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
// Query Keys
// ============================================================================

const INCOME_KEY = 'incomes';
const incomeKey = (id: string): [string, string] => [INCOME_KEY, id];

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get incomes for a month or all incomes.
 */
export function useIncomes(
  query: IncomeQuery = {}
): UseQueryResult<Income[], Error> {
  return useQuery({
    queryKey: [INCOME_KEY, query],
    queryFn: () => incomesRepository.findMany(query),
  });
}

/**
 * Get a single income by ID.
 */
export function useIncome(id: string): UseQueryResult<Income, Error> {
  return useQuery({
    queryKey: incomeKey(id),
    queryFn: () =>
      incomesRepository.findMany({}).then((incomes) => {
        const income = incomes.find((i) => i.id === id);
        if (!income) throw new Error(`Income ${id} not found`);
        return income;
      }),
    enabled: Boolean(id),
  });
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
      void queryClient.invalidateQueries({ queryKey: [INCOME_KEY] });
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
      void queryClient.invalidateQueries({ queryKey: [INCOME_KEY] });
      void queryClient.invalidateQueries({ queryKey: incomeKey(id) });
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
      void queryClient.invalidateQueries({ queryKey: [INCOME_KEY] });
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
      void queryClient.invalidateQueries({ queryKey: incomeKey(id) });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
