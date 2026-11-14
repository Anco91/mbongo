/**
 * M2 tests for AccountService linkedAccountId invariants
 * (spec deferred-card: settlement account).
 *
 * @module Tests/Accounts/M2LinkedAccount
 * @jest-environment node
 */
import { AccountService } from '@/server/accounts/account.service';
import { HttpError } from '@/server/common/http';

jest.mock('@/server/db', () => ({
  prisma: {
    member: { findUnique: jest.fn() },
    account: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/server/db';

const mockedMemberFindUnique = prisma.member.findUnique as jest.Mock;
const mockedAccountFindUnique = prisma.account.findUnique as jest.Mock;
const mockedAccountCreate = prisma.account.create as jest.Mock;
const mockedAccountUpdate = prisma.account.update as jest.Mock;

const accountRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'card-ubs-0001',
  name: 'Carte UBS',
  bank: 'UBS',
  currency: 'CHF',
  accountType: 'CREDIT_CARD',
  memberId: null,
  overdraftLimit: 0,
  deferredCard: false,
  billingDay: 28,
  linkedAccountId: 'courant-ubs-0001',
  openingBalance: 0,
  status: 'ACTIVE',
  closedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('AccountService — linkedAccountId invariants (create)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates a credit card with its settlement account', async () => {
    mockedAccountFindUnique.mockResolvedValue({ id: 'courant-ubs-0001' });
    mockedAccountCreate.mockResolvedValue(accountRow());

    await new AccountService().create({
      name: 'Carte UBS',
      currency: 'CHF',
      accountType: 'CREDIT_CARD',
      linkedAccountId: 'courant-ubs-0001',
    });

    expect(mockedAccountCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountType: 'CREDIT_CARD',
          linkedAccountId: 'courant-ubs-0001',
        }),
      })
    );
  });

  it('rejects a credit card without settlement account (400)', async () => {
    await expect(
      new AccountService().create({
        name: 'Carte UBS',
        currency: 'CHF',
        accountType: 'CREDIT_CARD',
      })
    ).rejects.toMatchObject({
      status: 400,
      details: expect.objectContaining({ message: expect.any(String) }),
    } as Partial<HttpError>);

    expect(mockedAccountCreate).not.toHaveBeenCalled();
  });

  it('rejects a linkedAccountId on a non-card account (400, nothing persisted)', async () => {
    await expect(
      new AccountService().create({
        name: 'UBS Courant',
        currency: 'CHF',
        accountType: 'CURRENT',
        linkedAccountId: 'courant-ubs-0001',
      })
    ).rejects.toMatchObject({ status: 400 } as Partial<HttpError>);

    expect(mockedAccountCreate).not.toHaveBeenCalled();
  });

  it('rejects an unknown settlement account with a readable 422', async () => {
    mockedAccountFindUnique.mockResolvedValue(null);

    await expect(
      new AccountService().create({
        name: 'Carte UBS',
        currency: 'CHF',
        accountType: 'CREDIT_CARD',
        linkedAccountId: 'nope',
      })
    ).rejects.toMatchObject({
      status: 422,
      details: expect.objectContaining({ message: expect.any(String) }),
    } as Partial<HttpError>);

    expect(mockedAccountCreate).not.toHaveBeenCalled();
  });

  it('still validates the member first for a non-card account', async () => {
    mockedMemberFindUnique.mockResolvedValue(null);

    await expect(
      new AccountService().create({
        name: 'UBS Courant',
        currency: 'CHF',
        accountType: 'CURRENT',
        memberId: 'nope',
      })
    ).rejects.toMatchObject({ status: 422 } as Partial<HttpError>);
  });
});

describe('AccountService — linkedAccountId invariants (update)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('refuses a linkedAccountId added to a non-card account (400)', async () => {
    mockedAccountFindUnique.mockResolvedValue(
      accountRow({ accountType: 'JOINT', linkedAccountId: null })
    );

    await expect(
      new AccountService().update('card-ubs-0001', {
        linkedAccountId: 'courant-ubs-0001',
      })
    ).rejects.toMatchObject({ status: 400 } as Partial<HttpError>);

    expect(mockedAccountUpdate).not.toHaveBeenCalled();
  });

  it('accepts adding a settlement account to an existing credit card', async () => {
    mockedAccountFindUnique.mockResolvedValue(
      accountRow({ linkedAccountId: null })
    );
    mockedAccountFindUnique
      .mockResolvedValueOnce(accountRow({ linkedAccountId: null }))
      .mockResolvedValueOnce({ id: 'courant-ubs-0001' });
    mockedAccountUpdate.mockResolvedValue(accountRow());

    await new AccountService().update('card-ubs-0001', {
      linkedAccountId: 'courant-ubs-0001',
    });

    expect(mockedAccountUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'card-ubs-0001' },
        data: expect.objectContaining({
          linkedAccountId: 'courant-ubs-0001',
        }),
      })
    );
  });

  it('does not force the settlement on a legacy card edited elsewhere', async () => {
    mockedAccountFindUnique
      .mockResolvedValueOnce(accountRow({ linkedAccountId: null }))
      .mockResolvedValueOnce(null);
    mockedAccountUpdate.mockResolvedValue(
      accountRow({ name: 'Carte UBS renommée', linkedAccountId: null })
    );

    const updated = await new AccountService().update('card-ubs-0001', {
      name: 'Carte UBS renommée',
    });

    expect(updated.name).toBe('Carte UBS renommée');
    expect(mockedAccountUpdate).toHaveBeenCalled();
  });
});
