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
import type {
  Member,
  CreateMemberInput,
  UpdateMemberInput,
} from '@mbongo/shared';

const MEMBERS_KEY = 'members';

/**
 * List household members.
 */
export function useMembers(): UseQueryResult<Member[], Error> {
  return useQuery({
    queryKey: [MEMBERS_KEY],
    queryFn: () => membersRepository.findMany(),
  });
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
      void queryClient.invalidateQueries({ queryKey: [MEMBERS_KEY] });
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
      void queryClient.invalidateQueries({ queryKey: [MEMBERS_KEY] });
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
      void queryClient.invalidateQueries({ queryKey: [MEMBERS_KEY] });
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
