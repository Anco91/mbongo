/**
 * ChargeService — the server re-checks the sub-category invariant
 * (spec charge-subcategories). A patch that changes only the category must
 * not leave a stale sub-category behind.
 *
 * @module Tests/Charges/ChargeSubcategoryService
 * @jest-environment node
 */
import { ChargeService } from '@/server/charges/charge.service';
import { HttpError } from '@/server/common/http';

jest.mock('@/server/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    account: { findUnique: jest.fn() },
    charge: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    payment: { createMany: jest.fn(), deleteMany: jest.fn() },
  },
}));

import { prisma } from '@/server/db';

const mockedTransaction = prisma.$transaction as jest.Mock;
const mockedAccount = prisma.account.findUnique as jest.Mock;
const mockedCreate = prisma.charge.create as jest.Mock;
const mockedFind = prisma.charge.findUnique as jest.Mock;
const mockedUpdate = prisma.charge.update as jest.Mock;

const row = {
  id: 'charge-1',
  label: 'Forfait mobile',
  type: 'FIXED_RECURRING',
  amount: 25,
  currency: 'CHF',
  category: 'Abonnements',
  subcategory: 'Mobile',
  startDate: new Date('2026-11-01T00:00:00.000Z'),
  endDate: null,
  frequency: 'monthly',
  installments: null,
  dueDay: null,
  provisioned: false,
  accountId: 'account-1',
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  updatedAt: new Date('2026-11-01T00:00:00.000Z'),
};

const createInput = {
  label: 'Forfait mobile',
  type: 'FIXED_RECURRING' as const,
  amount: 25,
  currency: 'CHF' as const,
  accountId: 'account-1',
  category: 'Abonnements',
  subcategory: 'Mobile',
  startDate: '2026-11-01',
  endDate: null,
  frequency: 'monthly' as const,
  installments: null,
  dueDay: null,
  provisioned: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
    fn(prisma)
  );
  mockedAccount.mockResolvedValue({ id: 'account-1' });
  mockedCreate.mockResolvedValue(row);
  mockedFind.mockResolvedValue(row);
  mockedUpdate.mockResolvedValue(row);
});

describe('ChargeService.create sub-category', () => {
  it('persists a valid sub-category', async () => {
    await new ChargeService().create(createInput);

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subcategory: 'Mobile' }),
      })
    );
  });

  it('persists null when no sub-category is given', async () => {
    await new ChargeService().create({ ...createInput, subcategory: null });

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subcategory: null }),
      })
    );
  });

  it('refuses a sub-category foreign to the category with a 422', async () => {
    await expect(
      new ChargeService().create({
        ...createInput,
        category: 'Logement',
        subcategory: 'Mobile',
      })
    ).rejects.toMatchObject({ status: 422 } as Partial<HttpError>);

    expect(mockedCreate).not.toHaveBeenCalled();
  });
});

describe('ChargeService.update sub-category', () => {
  it('does not touch the sub-category when the patch ignores both fields', async () => {
    await new ChargeService().update('charge-1', { label: 'Mobile famille' });

    const data = mockedUpdate.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('subcategory');
  });

  it('resets the stored sub-category when only the category changes', async () => {
    await new ChargeService().update('charge-1', { category: 'Logement' });

    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'Logement',
          subcategory: null,
        }),
      })
    );
  });

  it('writes a valid sub-category for the stored category', async () => {
    await new ChargeService().update('charge-1', { subcategory: 'Sport' });

    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subcategory: 'Sport' }),
      })
    );
  });

  it('refuses a sub-category foreign to the stored category with a 422', async () => {
    await expect(
      new ChargeService().update('charge-1', { subcategory: 'LAMal' })
    ).rejects.toMatchObject({ status: 422 } as Partial<HttpError>);

    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('accepts a new category with its own sub-category in one patch', async () => {
    await new ChargeService().update('charge-1', {
      category: 'Santé',
      subcategory: 'LAMal',
    });

    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'Santé',
          subcategory: 'LAMal',
        }),
      })
    );
  });

  it('keeps a legacy charge editable: null sub-category on a free category', async () => {
    mockedFind.mockResolvedValue({
      ...row,
      category: 'rent',
      subcategory: null,
    });

    await new ChargeService().update('charge-1', { label: 'Loyer' });

    expect(mockedUpdate).toHaveBeenCalled();
  });
});
