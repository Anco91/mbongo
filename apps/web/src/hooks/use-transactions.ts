/**
 * Use Transactions Hook
 *
 * Transverse React Query hook exposing transactions.
 * Consumed by the accounts view (balance computation) and later views.
 *
 * @module Hooks/UseTransactions
 */

'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { transactionsRepository } from '@/repositories/transactions.repository';
import type { Transaction, TransactionQuery } from '@mbongo/shared';

/**
 * List transactions (optionally filtered).
 */
export function useTransactions(
  query: TransactionQuery = {}
): UseQueryResult<Transaction[], Error> {
  return useQuery({
    queryKey: ['transactions', query],
    queryFn: () => transactionsRepository.findMany(query),
  });
}
