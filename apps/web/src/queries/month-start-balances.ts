/**
 * Month Start Balance Queries
 *
 * Query factory: the only source of their query keys and `queryOptions`.
 *
 * @module Queries/MonthStartBalances
 */

import { queryOptions } from '@tanstack/react-query';
import { monthStartBalancesRepository } from '@/repositories/month-start-balances.repository';

const KEY = 'month-start-balances' as const;

export const monthStartBalanceQueries = {
  all: () => [KEY] as const,
  byMonth: (month: string) =>
    queryOptions({
      queryKey: [KEY, month] as const,
      queryFn: () => monthStartBalancesRepository.findByMonth(month),
      enabled: Boolean(month),
    }),
};
