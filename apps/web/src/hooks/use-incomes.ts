/**
 * Use Incomes Hook
 *
 * React Query hooks for managing income sources.
 *
 * @module Hooks/UseIncomes
 */

'use client';

import { useMemo } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { incomesRepository } from '@/repositories/incomes.repository';
import { incomeQueries } from '@/queries/incomes';
import { transactionQueries } from '@/queries/transactions';
import { accountQueries } from '@/queries/accounts';
import {
  Income,
  CreateIncomeInput,
  UpdateIncomeInput,
  ConfirmIncomeInput,
  IncomeQuery,
  Transaction,
  LinkIncomeInput,
  UnmatchedIncome,
  findUnmatchedIncome,
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

/**
 * Positive transactions without income source, with ranked proposals.
 */
export function useUnmatchedIncome(): {
  items: UnmatchedIncome[];
  incomes: Income[];
  isLoading: boolean;
  error: Error | null;
  nextPageError: Error | null;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
} {
  const transactions = useInfiniteQuery(transactionQueries.unmatchedIncome());
  const incomes = useQuery(incomeQueries.list({}));
  const accounts = useQuery(accountQueries.list());

  const items = useMemo(() => {
    const closedIds = new Set(
      (accounts.data ?? [])
        .filter((account) => account.status === 'CLOSED')
        .map((account) => account.id)
    );
    const openTransactions = (transactions.data?.pages.flat() ?? []).filter(
      (t) => !closedIds.has(t.accountId)
    );
    return findUnmatchedIncome(openTransactions, incomes.data ?? []);
  }, [transactions.data, incomes.data, accounts.data]);

  const hasLoadedPages = transactions.data !== undefined;

  return {
    items,
    incomes: incomes.data ?? [],
    isLoading:
      transactions.isLoading || incomes.isLoading || accounts.isLoading,
    error:
      (hasLoadedPages ? null : transactions.error) ??
      incomes.error ??
      accounts.error,
    nextPageError: hasLoadedPages ? transactions.error : null,
    hasNextPage: transactions.hasNextPage,
    fetchNextPage: () => void transactions.fetchNextPage(),
    isFetchingNextPage: transactions.isFetchingNextPage,
  };
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

/**
 * Link an existing transaction to an income source for a month.
 */
export function useLinkIncome(): UseMutationResult<
  Transaction,
  Error,
  { id: string; input: LinkIncomeInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }) => incomesRepository.link(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: transactionQueries.all(),
      });
      void queryClient.invalidateQueries({ queryKey: incomeQueries.all() });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
