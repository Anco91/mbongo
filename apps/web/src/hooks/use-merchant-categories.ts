/**
 * Use Merchant Categories Hooks
 *
 * React Query hooks for the persisted merchant → category mapping.
 *
 * @module Hooks/UseMerchantCategories
 */

'use client';

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { merchantCategoriesRepository } from '@/repositories/merchant-categories.repository';
import { merchantCategoryQueries } from '@/queries/merchant-categories';
import type {
  MerchantCategory,
  SetMerchantCategoryInput,
} from '@mbongo/shared';

/** Mapping `merchant → category`, prefetched by `ImportGuard`. */
export function useMerchantMapping(): Readonly<Record<string, string>> {
  const { data } = useSuspenseQuery(merchantCategoryQueries.list());
  return useMemo(
    () => Object.fromEntries(data.map((r) => [r.merchant, r.category])),
    [data]
  );
}

/** Sets (or clears) the category of a merchant, then refreshes the mapping. */
export function useSetMerchantCategory(): UseMutationResult<
  MerchantCategory[],
  Error,
  SetMerchantCategoryInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SetMerchantCategoryInput) =>
      merchantCategoriesRepository.set(input),
    onSuccess: (rows) => {
      queryClient.setQueryData(merchantCategoryQueries.list().queryKey, rows);
    },
  });
}
