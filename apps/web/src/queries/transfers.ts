/**
 * Transfer Queries
 *
 * Query factory for transfers: the only source of their query keys and
 * `queryOptions`. Keys match the guards' server prefetch.
 *
 * @module Queries/Transfers
 */

import { queryOptions } from '@tanstack/react-query';
import { transfersRepository } from '@/repositories/transfers.repository';
import type { TransferQuery } from '@mbongo/shared';

const KEY = 'transfers' as const;

export const transferQueries = {
  all: () => [KEY] as const,
  list: (query: TransferQuery = {}) =>
    queryOptions({
      queryKey: [KEY, query] as const,
      queryFn: () => transfersRepository.findMany(query),
    }),
};
