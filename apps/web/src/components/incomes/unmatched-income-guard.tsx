/**
 * Unmatched Income Guard Component
 *
 * Server container: prefetches the transactions window and the income
 * sources used by the unmatched-income screen.
 *
 * @module Components/Incomes/UnmatchedIncomeGuard
 */

import { transactionService } from '@/server/transactions/transaction.service';
import { incomeService } from '@/server/incomes/income.service';
import { UNMATCHED_QUERY } from '@/lib/month-queries';
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
      queryKey: ['transactions', UNMATCHED_QUERY],
      queryFn: () => transactionService.findMany(UNMATCHED_QUERY),
    },
    {
      queryKey: ['incomes', {}],
      queryFn: () => incomeService.findMany({}),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
