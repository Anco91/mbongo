/**
 * Merchant Category Schemas
 *
 * Merchant → charge category mapping learned on the bank import screen.
 * An empty category or « À catégoriser » removes the mapping.
 *
 * @packageDocumentation
 */

import { z } from 'zod';

const MERCHANT_MAX = 200;
const CATEGORY_MAX = 100;

/** One persisted mapping. */
export const merchantCategorySchema = z.object({
  merchant: z.string().trim().min(1).max(MERCHANT_MAX),
  category: z.string().trim().min(1).max(CATEGORY_MAX),
});

/** Body of the idempotent set: an empty category clears the merchant. */
export const setMerchantCategorySchema = z.object({
  merchant: z.string().trim().min(1).max(MERCHANT_MAX),
  category: z.string().trim().max(CATEGORY_MAX),
});

export type MerchantCategory = z.infer<typeof merchantCategorySchema>;
export type SetMerchantCategoryInput = z.infer<
  typeof setMerchantCategorySchema
>;
