/**
 * Import Guard Component
 *
 * Server container: prefetches accounts and transactions (statement gap)
 * with the same keys as the accounts guard.
 *
 * @module Components/Import/ImportGuard
 */

import { accountService } from '@/server/accounts/account.service';
import { merchantCategoryService } from '@/server/merchant-categories/merchant-category.service';
import { merchantCategoryQueries } from '@/queries/merchant-categories';
import { transactionService } from '@/server/transactions/transaction.service';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
import { JSX } from 'react';

export function ImportGuard({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const entries: PrefetchEntry[] = [
    {
      queryKey: ['accounts', {}],
      queryFn: () => accountService.findMany({}),
    },
    {
      queryKey: ['transactions', {}],
      queryFn: () => transactionService.findMany({}),
    },
    {
      queryKey: merchantCategoryQueries.all(),
      queryFn: () => merchantCategoryService.findAll(),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
