/**
 * Monthly Budget Queries
 *
 * Query factory for monthly budgets: the only source of their query keys and
 * `queryOptions`. Keys match the guards' server prefetch.
 *
 * @module Queries/MonthlyBudgets
 */

import { queryOptions } from '@tanstack/react-query';
import { monthlyBudgetsRepository } from '@/repositories/monthly-budgets.repository';

const KEY = 'monthly-budgets' as const;

export const monthlyBudgetQueries = {
  all: () => [KEY] as const,
  detail: (month: string) =>
    queryOptions({
      queryKey: [KEY, month] as const,
      queryFn: () => monthlyBudgetsRepository.findOne(month),
      enabled: Boolean(month),
    }),
};
