/**
 * Transfers Guard Component
 *
 * Server container: data guaranteed before render.
 * Prefetches transfers (and accounts for naming) on the server, then
 * hands the hydrated cache to the client view.
 *
 * @module Components/Transfers/TransfersGuard
 */

import { transferService } from '@/server/transfers/transfer.service';
import { accountService } from '@/server/accounts/account.service';
import { TransferQuery } from '@mbongo/shared';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
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
export function TransfersGuard({
  query = {},
  children,
}: TransfersGuardProps & { children: React.ReactNode }): JSX.Element {
  const entries: PrefetchEntry[] = [
    {
      queryKey: ['transfers', query],
      queryFn: () => transferService.findMany(query),
    },
    {
      queryKey: ['accounts', {}],
      queryFn: () => accountService.findMany({}),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
