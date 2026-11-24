/**
 * Income Queries
 *
 * Query factory for incomes: the only source of their query keys and
 * `queryOptions`. Keys match the guards' server prefetch.
 *
 * @module Queries/Incomes
 */

import { queryOptions } from '@tanstack/react-query';
import { incomesRepository } from '@/repositories/incomes.repository';
import type { IncomeQuery } from '@mbongo/shared';

const KEY = 'incomes' as const;

export const incomeQueries = {
  all: () => [KEY] as const,
  list: (query: IncomeQuery = {}) =>
    queryOptions({
      queryKey: [KEY, query] as const,
      queryFn: () => incomesRepository.findMany(query),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [KEY, id] as const,
      queryFn: () =>
        incomesRepository.findMany({}).then((incomes) => {
          const income = incomes.find((i) => i.id === id);
          if (!income) throw new Error(`Income ${id} not found`);
          return income;
        }),
      enabled: Boolean(id),
    }),
};
