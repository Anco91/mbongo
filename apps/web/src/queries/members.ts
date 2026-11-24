/**
 * Member Queries
 *
 * Query factory for household members: the only source of their query
 * keys and `queryOptions`. Keys match the guards' server prefetch.
 *
 * @module Queries/Members
 */

import { queryOptions } from '@tanstack/react-query';
import { membersRepository } from '@/repositories/members.repository';

const KEY = 'members' as const;

export const memberQueries = {
  all: () => [KEY] as const,
  list: () =>
    queryOptions({
      queryKey: [KEY] as const,
      queryFn: () => membersRepository.findMany(),
    }),
};
