/**
 * Use Members Hook
 *
 * Read-only React Query hook exposing household members (M1 scope).
 * Consumed by the account creation form (owner selector).
 *
 * @module Components/Members/Hooks/UseMembers
 */

'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { membersRepository } from '@/repositories/members.repository';
import type { Member } from '@mbongo/shared';

/**
 * List household members.
 */
export function useMembers(): UseQueryResult<Member[], Error> {
  return useQuery({
    queryKey: ['members'],
    queryFn: () => membersRepository.findMany(),
  });
}
