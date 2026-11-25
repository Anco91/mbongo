import {
  merchantCategorySchema,
  setMerchantCategorySchema,
  type MerchantCategory,
  type MerchantCategoryHttp,
  type SetMerchantCategoryInput,
} from '@mbongo/shared';
import { request } from '@/lib/api';
import { z } from 'zod';

export const merchantCategoriesRepository: MerchantCategoryHttp = {
  async findAll(): Promise<MerchantCategory[]> {
    const rows = await request<MerchantCategory[]>(
      'GET',
      '/merchant-categories'
    );
    return z.array(merchantCategorySchema).parse(rows);
  },

  async set(input: SetMerchantCategoryInput): Promise<MerchantCategory[]> {
    const body = setMerchantCategorySchema.parse(input);
    const rows = await request<MerchantCategory[]>(
      'PUT',
      '/merchant-categories',
      { body }
    );
    return z.array(merchantCategorySchema).parse(rows);
  },
};
