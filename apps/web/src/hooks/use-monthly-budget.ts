/**
 * Use Monthly Budget Hook
 *
 * React Query hooks for managing monthly budget state.
 *
 * @module Hooks/UseMonthlyBudget
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { monthlyBudgetsRepository } from '@/repositories/monthly-budgets.repository';
import { monthlyBudgetQueries } from '@/queries/monthly-budgets';
import { MonthlyBudget } from '@mbongo/shared';

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get monthly budget state for a given month.
 * Returns null if the month has never been prepared.
 */
export function useMonthlyBudget(
  month: string
): UseQueryResult<MonthlyBudget | null, Error> {
  return useQuery(monthlyBudgetQueries.detail(month));
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Prepare a month (idempotent upsert).
 */
export function usePrepareMonthlyBudget(): UseMutationResult<
  MonthlyBudget,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (month) => monthlyBudgetsRepository.prepare(month),
    onSuccess: (_, month) => {
      void queryClient.invalidateQueries({
        queryKey: monthlyBudgetQueries.detail(month).queryKey,
      });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
