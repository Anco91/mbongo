/**
 * Unmatched Income Guard Component
 *
 * Server container: prefetches the transactions window and the income
 * sources used by the unmatched-income screen.
 *
 * @module Components/Incomes/UnmatchedIncomeGuard
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { transactionService } from '@/server/transactions/transaction.service';
import { incomeService } from '@/server/incomes/income.service';
import { UNMATCHED_QUERY } from '@/lib/month-queries';
import { JSX } from 'react';

export async function UnmatchedIncomeGuard({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const qc = new QueryClient();

  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['transactions', UNMATCHED_QUERY],
      queryFn: () => transactionService.findMany(UNMATCHED_QUERY),
    }),
    qc.prefetchQuery({
      queryKey: ['incomes', {}],
      queryFn: () => incomeService.findMany({}),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
