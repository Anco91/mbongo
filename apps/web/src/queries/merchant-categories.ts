/**
 * Merchant Category Queries
 *
 * Query factory for the merchant → category mapping: the only source of its
 * query keys and `queryOptions`.
 *
 * @module Queries/MerchantCategories
 */

import { queryOptions } from '@tanstack/react-query';
import { merchantCategoriesRepository } from '@/repositories/merchant-categories.repository';

const KEY = 'merchant-categories' as const;

export const merchantCategoryQueries = {
  all: () => [KEY] as const,
  list: () =>
    queryOptions({
      queryKey: [KEY] as const,
      queryFn: () => merchantCategoriesRepository.findAll(),
    }),
};
