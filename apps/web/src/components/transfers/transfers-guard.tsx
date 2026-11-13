/**
 * Transfers Guard Component
 *
 * Server container: data guaranteed before render.
 * Prefetches transfers (and accounts for naming) on the server, then
 * hands the hydrated cache to the client view.
 *
 * @module Components/Transfers/TransfersGuard
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { transferService } from '@/server/transfers/transfer.service';
import { accountService } from '@/server/accounts/account.service';
import { TransfersView } from './transfers-view';
import { TransferQuery } from '@mbongo/shared';
import { JSX } from 'react';

/**
 * Props for TransfersGuard
 */
interface TransfersGuardProps {
  query?: TransferQuery;
}

/**
 * TransfersGuard Component
 *
 * Server Component that prefetches data via the server-side services
 * (direct call, never a fetch to our own API — R5).
 */
export async function TransfersGuard({
  query = {},
}: TransfersGuardProps): Promise<JSX.Element> {
  const qc = new QueryClient();

  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['transfers', query],
      queryFn: () => transferService.findMany(query),
    }),
    qc.prefetchQuery({
      queryKey: ['accounts', {}],
      queryFn: () => accountService.findMany({}),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <TransfersView />
    </HydrationBoundary>
  );
}
