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
import type {
  Account,
  AccountQuery,
  CreateAccountInput,
  UpdateAccountInput,
} from '@mbongo/shared';

const ACCOUNTS_KEY = 'accounts';

/**
 * List accounts (active ones for the current views, filterable).
 */
export function useAccounts(
  query: AccountQuery = {}
): UseQueryResult<Account[], Error> {
  return useQuery({
    queryKey: [ACCOUNTS_KEY, query],
    queryFn: () => accountsRepository.findMany(query),
  });
}

/**
 * Get a single account by ID.
 */
export function useAccount(id: string): UseQueryResult<Account, Error> {
  return useQuery({
    queryKey: [ACCOUNTS_KEY, id],
    queryFn: () => accountsRepository.findOne(id),
    enabled: Boolean(id),
  });
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
      void queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] });
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
      void queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] });
      queryClient.setQueryData([ACCOUNTS_KEY, account.id], account);
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
      void queryClient.invalidateQueries({ queryKey: [ACCOUNTS_KEY] });
    },
  });
}
