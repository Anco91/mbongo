/**
 * Query Client Factory
 *
 * Creates a singleton QueryClient for server-side prefetching.
 * Uses a global cache to share the client across requests in dev.
 *
 * @module Lib/QueryClient
 */

import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });

const getQueryClient = cache(createQueryClient);

export { getQueryClient };
