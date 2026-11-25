/**
 * Merchant Categories API Route
 *
 * Pure wiring: requests are delegated to the MerchantCategoriesController.
 *
 * @module API/MerchantCategories
 */

import { NextResponse } from 'next/server';
import { merchantCategoriesController } from '@/server/merchant-categories/merchant-categories.controller';

/** GET /api/merchant-categories */
export const GET = (): Promise<NextResponse> =>
  merchantCategoriesController.find();

/** PUT /api/merchant-categories */
export const PUT = (request: Request): Promise<NextResponse> =>
  merchantCategoriesController.set(request);
