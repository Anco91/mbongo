/**
 * Transaction Queries
 *
 * Query factory for transactions: the only source of their query keys
 * and `queryOptions`. Keys match the guards' server prefetch.
 *
 * @module Queries/Transactions
 */

import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { transactionsRepository } from '@/repositories/transactions.repository';
import { unmatchedIncomeQuery, UNMATCHED_PAGE_SIZE } from '@/lib/month-queries';
import type { TransactionQuery } from '@mbongo/shared';

const KEY = 'transactions' as const;

export const transactionQueries = {
  all: () => [KEY] as const,
  list: (query: TransactionQuery = {}) =>
    queryOptions({
      queryKey: [KEY, query] as const,
      queryFn: () => transactionsRepository.findMany(query),
    }),
  /** Unmatched income, one page per cursor (id of the last row). */
  unmatchedIncome: () =>
    infiniteQueryOptions({
      queryKey: [KEY, 'unmatched-income'] as const,
      queryFn: ({ pageParam }) =>
        transactionsRepository.findMany(unmatchedIncomeQuery(pageParam)),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.length === UNMATCHED_PAGE_SIZE
          ? lastPage[lastPage.length - 1]?.id
          : undefined,
    }),
};
