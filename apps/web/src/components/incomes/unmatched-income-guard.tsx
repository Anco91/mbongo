/**
 * Unmatched Income Guard Component
 *
 * Server container: prefetches the first page of unmatched income and the income
 * sources used by the unmatched-income screen.
 *
 * @module Components/Incomes/UnmatchedIncomeGuard
 */

import { transactionService } from '@/server/transactions/transaction.service';
import { incomeService } from '@/server/incomes/income.service';
import { unmatchedIncomeQuery } from '@/lib/month-queries';
import { transactionQueries } from '@/queries/transactions';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
import { JSX } from 'react';

export function UnmatchedIncomeGuard({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const entries: PrefetchEntry[] = [
    {
      // Same key as the infinite hook; first page in infinite-data shape.
      queryKey: transactionQueries.unmatchedIncome().queryKey,
      queryFn: async () => ({
        pages: [await transactionService.findMany(unmatchedIncomeQuery())],
        pageParams: [undefined],
      }),
    },
    {
      queryKey: ['incomes', {}],
      queryFn: () => incomeService.findMany({}),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
