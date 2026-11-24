/**
 * Charge Queries
 *
 * Query factory for charges: the only source of their query keys and
 * `queryOptions`. Keys match the guards' server prefetch.
 *
 * @module Queries/Charges
 */

import { queryOptions } from '@tanstack/react-query';
import { chargesRepository } from '@/repositories/charges.repository';
import type { ChargeQuery } from '@mbongo/shared';

const KEY = 'charges' as const;

export const chargeQueries = {
  all: () => [KEY] as const,
  list: (query: ChargeQuery = {}) =>
    queryOptions({
      queryKey: [KEY, query] as const,
      queryFn: () => chargesRepository.findMany(query),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [KEY, id] as const,
      queryFn: () => chargesRepository.findOne(id),
      enabled: Boolean(id),
    }),
};
