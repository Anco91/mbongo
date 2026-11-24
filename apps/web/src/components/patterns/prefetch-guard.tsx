/**
 * PrefetchGuard — generic server container: prefetches every declared
 * entry on a fresh QueryClient, then hands the hydrated cache to its
 * children. Domain guards only declare their entries.
 *
 * @module Components/Patterns/PrefetchGuard
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { JSX } from 'react';

export interface PrefetchEntry {
  queryKey: readonly unknown[];
  queryFn: () => Promise<unknown>;
}

export async function PrefetchGuard({
  entries,
  children,
}: {
  entries: readonly PrefetchEntry[];
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const qc = new QueryClient();

  await Promise.all(entries.map((entry) => qc.prefetchQuery(entry)));

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
