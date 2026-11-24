/**
 * Account Queries
 *
 * Query factory for accounts: the only source of their query keys and
 * `queryOptions`. Keys match the guards' server prefetch.
 *
 * @module Queries/Accounts
 */

import { queryOptions } from '@tanstack/react-query';
import { accountsRepository } from '@/repositories/accounts.repository';
import type { AccountQuery } from '@mbongo/shared';

const KEY = 'accounts' as const;

export const accountQueries = {
  all: () => [KEY] as const,
  list: (query: AccountQuery = {}) =>
    queryOptions({
      queryKey: [KEY, query] as const,
      queryFn: () => accountsRepository.findMany(query),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [KEY, id] as const,
      queryFn: () => accountsRepository.findOne(id),
      enabled: Boolean(id),
    }),
};
