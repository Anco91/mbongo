/**
 * Use Accounts Hook
 *
 * React Query hooks for managing accounts data.
 * Domain hooks only — components never call the API directly (R8).
 *
 * @module Components/Accounts/Hooks/UseAccounts
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { accountsRepository } from '@/repositories/accounts.repository';
import { accountQueries } from '@/queries/accounts';
import type {
  Account,
  AccountQuery,
  CreateAccountInput,
  UpdateAccountInput,
} from '@mbongo/shared';

/**
 * List accounts (active ones for the current views, filterable).
 */
export function useAccounts(
  query: AccountQuery = {}
): UseQueryResult<Account[], Error> {
  return useQuery(accountQueries.list(query));
}

/**
 * Get a single account by ID.
 */
export function useAccount(id: string): UseQueryResult<Account, Error> {
  return useQuery(accountQueries.detail(id));
}

/**
 * Create an account, then refresh the list.
 */
export function useCreateAccount(): UseMutationResult<
  Account,
  Error,
  CreateAccountInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsRepository.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountQueries.all() });
    },
  });
}

/**
 * Update an account, then refresh the list and the detail.
 */
export function useUpdateAccount(): UseMutationResult<
  Account,
  Error,
  { id: string; input: UpdateAccountInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAccountInput }) =>
      accountsRepository.update(id, input),
    onSuccess: (account) => {
      void queryClient.invalidateQueries({ queryKey: accountQueries.all() });
      queryClient.setQueryData(accountQueries.detail(account.id).queryKey, account);
    },
  });
}

/**
 * Close an account (soft delete: status CLOSED + closedAt).
 */
export function useCloseAccount(): UseMutationResult<Account, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountsRepository.close(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountQueries.all() });
    },
  });
}
