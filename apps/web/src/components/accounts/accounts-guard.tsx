/**
 * Accounts Guard Component
 *
 * Server container: data guaranteed before render.
 * Prefetches accounts and transactions (for balance computation) on the
 * server, then hands the hydrated cache to the client view.
 *
 * @module Components/Accounts/AccountsGuard
 */

import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { AccountQuery } from '@mbongo/shared';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
import { JSX } from 'react';

/**
 * Props for AccountsGuard
 */
interface AccountsGuardProps {
  query?: AccountQuery;
}

/**
 * AccountsGuard Component
 *
 * Server Component that prefetches both data sets via the server-side
 * services (direct call, never a fetch to our own API — R5).
 */
export function AccountsGuard({
  query = {},
  children,
}: AccountsGuardProps & { children: React.ReactNode }): JSX.Element {
  const entries: PrefetchEntry[] = [
    {
      queryKey: ['accounts', query],
      queryFn: () => accountService.findMany(query),
    },
    {
      queryKey: ['transactions', {}],
      queryFn: () => transactionService.findMany({}),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
