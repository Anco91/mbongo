/**
 * Merchant Category Service
 *
 * Persisted merchant → category mapping of the bank import screen.
 *
 * @module Server/MerchantCategories/Service
 */

import { prisma } from '@/server/db';
import {
  UNCATEGORIZED,
  type MerchantCategory,
  type SetMerchantCategoryInput,
} from '@mbongo/shared';

export class MerchantCategoryService {
  /** All mappings, by merchant. */
  async findAll(): Promise<MerchantCategory[]> {
    const rows = await prisma.merchantCategory.findMany({
      orderBy: { merchant: 'asc' },
    });
    return rows.map(({ merchant, category }) => ({ merchant, category }));
  }

  /** Idempotent set; an empty or « À catégoriser » category clears it. */
  async set(input: SetMerchantCategoryInput): Promise<MerchantCategory[]> {
    const { merchant, category } = input;
    if (category === '' || category === UNCATEGORIZED) {
      await prisma.merchantCategory.deleteMany({ where: { merchant } });
    } else {
      await prisma.merchantCategory.upsert({
        where: { merchant },
        update: { category },
        create: { merchant, category },
      });
    }
    return this.findAll();
  }
}

const globalForService = globalThis as {
  merchantCategoryService?: MerchantCategoryService;
};
export const merchantCategoryService =
  globalForService.merchantCategoryService ?? new MerchantCategoryService();

if (process.env.NODE_ENV !== 'production') {
  globalForService.merchantCategoryService = merchantCategoryService;
}
