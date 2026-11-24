/**
 * Transaction Queries
 *
 * Query factory for transactions: the only source of their query keys
 * and `queryOptions`. Keys match the guards' server prefetch.
 *
 * @module Queries/Transactions
 */

import { queryOptions } from '@tanstack/react-query';
import { transactionsRepository } from '@/repositories/transactions.repository';
import type { TransactionQuery } from '@mbongo/shared';

const KEY = 'transactions' as const;

export const transactionQueries = {
  all: () => [KEY] as const,
  list: (query: TransactionQuery = {}) =>
    queryOptions({
      queryKey: [KEY, query] as const,
      queryFn: () => transactionsRepository.findMany(query),
    }),
};
