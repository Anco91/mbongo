/**
 * Accounts Guard Component
 *
 * Server container: data guaranteed before render.
 * Prefetches accounts and transactions (for balance computation) on the
 * server, then hands the hydrated cache to the client view.
 *
 * @module Components/Accounts/AccountsGuard
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { AccountsView } from './accounts-view';
import { AccountQuery } from '@mbongo/shared';
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
export async function AccountsGuard({
  query = {},
}: AccountsGuardProps): Promise<JSX.Element> {
  const qc = new QueryClient();

  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['accounts', query],
      queryFn: () => accountService.findMany(query),
    }),
    qc.prefetchQuery({
      queryKey: ['transactions', {}],
      queryFn: () => transactionService.findMany({}),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <AccountsView />
    </HydrationBoundary>
  );
}
