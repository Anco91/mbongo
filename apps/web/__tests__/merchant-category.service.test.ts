/**
 * MerchantCategoryService (spec 46): an idempotent set; an empty or
 * « À catégoriser » category clears the merchant instead of storing it.
 *
 * @module Tests/Import/MerchantCategoryService
 * @jest-environment node
 */
import { setMerchantCategorySchema, UNCATEGORIZED } from '@mbongo/shared';
import { MerchantCategoryService } from '@/server/merchant-categories/merchant-category.service';

jest.mock('@/server/db', () => ({
  prisma: {
    merchantCategory: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/server/db';

const findMany = prisma.merchantCategory.findMany as jest.Mock;
const upsert = prisma.merchantCategory.upsert as jest.Mock;
const deleteMany = prisma.merchantCategory.deleteMany as jest.Mock;

describe('MerchantCategoryService.set', () => {
  const service = new MerchantCategoryService();

  beforeEach(() => {
    jest.clearAllMocks();
    findMany.mockResolvedValue([
      { merchant: 'RDB THONON', category: 'Alimentation', createdAt: 1 },
    ]);
  });

  it('upserts a real category and returns the mapping rows only', async () => {
    const rows = await service.set({
      merchant: 'RDB THONON',
      category: 'Alimentation',
    });

    expect(upsert).toHaveBeenCalledWith({
      where: { merchant: 'RDB THONON' },
      update: { category: 'Alimentation' },
      create: { merchant: 'RDB THONON', category: 'Alimentation' },
    });
    expect(deleteMany).not.toHaveBeenCalled();
    expect(rows).toEqual([
      { merchant: 'RDB THONON', category: 'Alimentation' },
    ]);
  });

  it.each(['', UNCATEGORIZED])('clears the merchant for %p', async (c) => {
    await service.set({ merchant: 'RDB THONON', category: c });

    expect(deleteMany).toHaveBeenCalledWith({
      where: { merchant: 'RDB THONON' },
    });
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe('setMerchantCategorySchema', () => {
  it('accepts an empty category (clear) and trims the merchant', () => {
    const parsed = setMerchantCategorySchema.parse({
      merchant: '  APPLE  ',
      category: '',
    });
    expect(parsed).toEqual({ merchant: 'APPLE', category: '' });
  });

  it('refuses a blank merchant', () => {
    expect(
      setMerchantCategorySchema.safeParse({ merchant: '  ', category: 'X' })
        .success
    ).toBe(false);
  });
});
