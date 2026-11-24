/**
 * Use Members Hook
 *
 * React Query hooks for household members (CRUD, M4 vue foyer).
 * Consumed by the account creation form (owner selector), the owner
 * badge and the household view.
 *
 * @module Components/Members/Hooks/UseMembers
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { membersRepository } from '@/repositories/members.repository';
import { memberQueries } from '@/queries/members';
import { accountQueries } from '@/queries/accounts';
import type {
  Member,
  CreateMemberInput,
  UpdateMemberInput,
} from '@mbongo/shared';

/**
 * List household members.
 */
export function useMembers(): UseQueryResult<Member[], Error> {
  return useQuery(memberQueries.list());
}

/**
 * Create a member, then refresh the list.
 */
export function useCreateMember(): UseMutationResult<
  Member,
  Error,
  CreateMemberInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMemberInput) => membersRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberQueries.all() });
    },
  });
}

/**
 * Update a member, then refresh the list.
 */
export function useUpdateMember(): UseMutationResult<
  Member,
  Error,
  { id: string; input: UpdateMemberInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMemberInput }) =>
      membersRepository.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberQueries.all() });
    },
  });
}

/**
 * Delete a member, then refresh the list (and accounts: owner becomes « Foyer »).
 */
export function useDeleteMember(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => membersRepository.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memberQueries.all() });
      void queryClient.invalidateQueries({ queryKey: accountQueries.all() });
    },
  });
}
