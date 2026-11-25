/**
 * Merchant Categories Controller
 *
 * Transport layer: validate → delegate → respond.
 *
 * @module Server/MerchantCategories/Controller
 */

import { NextResponse } from 'next/server';
import { setMerchantCategorySchema } from '@mbongo/shared';
import {
  parseBody,
  toErrorResponse,
  toSuccessResponse,
} from '@/server/common/http';
import {
  MerchantCategoryService,
  merchantCategoryService,
} from './merchant-category.service';

export class MerchantCategoriesController {
  constructor(private readonly categories: MerchantCategoryService) {}

  /** GET /api/merchant-categories */
  async find(): Promise<NextResponse> {
    try {
      return toSuccessResponse(await this.categories.findAll());
    } catch (error) {
      return toErrorResponse(error);
    }
  }

  /** PUT /api/merchant-categories — idempotent set of one merchant. */
  async set(request: Request): Promise<NextResponse> {
    try {
      const input = await parseBody(request, setMerchantCategorySchema);
      return toSuccessResponse(await this.categories.set(input));
    } catch (error) {
      return toErrorResponse(error);
    }
  }
}

const globalForController = globalThis as unknown as {
  merchantCategoriesController?: MerchantCategoriesController;
};

export const merchantCategoriesController =
  globalForController.merchantCategoriesController ??
  new MerchantCategoriesController(merchantCategoryService);

if (process.env.NODE_ENV !== 'production') {
  globalForController.merchantCategoriesController =
    merchantCategoriesController;
}
