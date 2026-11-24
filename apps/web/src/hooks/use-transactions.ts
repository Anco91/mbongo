/**
 * Use Transactions Hook
 *
 * Transverse React Query hook exposing transactions.
 * Consumed by the accounts view (balance computation) and later views.
 *
 * @module Hooks/UseTransactions
 */

'use client';

import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { transactionQueries } from '@/queries/transactions';
import { monthTransactionsQuery } from '@/lib/month-queries';
import type { Transaction, TransactionQuery } from '@mbongo/shared';

/**
 * List transactions (optionally filtered).
 */
export function useTransactions(
  query: TransactionQuery = {}
): UseQueryResult<Transaction[], Error> {
  return useQuery(transactionQueries.list(query));
}

/**
 * Transactions of ONE month ('YYYY-MM'), windowed on the date with the
 * same typed query the budget page prefetches (design D5).
 */
export function useMonthTransactions(
  monthKey: string
): UseQueryResult<Transaction[], Error> {
  const query = useMemo(() => monthTransactionsQuery(monthKey), [monthKey]);
  return useQuery(transactionQueries.list(query));
}
