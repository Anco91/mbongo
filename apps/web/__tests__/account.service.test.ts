/**
 * Tests for AccountService.create — member pre-validation.
 *
 * An unknown memberId produces a readable 422, never a raw FK 500.
 *
 * @module Tests/Accounts/AccountService
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
const mockedAccountCreate = prisma.account.create as jest.Mock;

const validInput = {
  name: 'UBS Courant',
  bank: 'UBS',
  currency: 'CHF' as const,
  accountType: 'CURRENT' as const,
  memberId: 'member-anco-0001',
};

const accountRow = {
  id: 'account-1',
  name: 'UBS Courant',
  bank: 'UBS',
  currency: 'CHF',
  accountType: 'CURRENT',
  memberId: 'member-anco-0001',
  overdraftLimit: 0,
  deferredCard: false,
  billingDay: null,
  openingBalance: 0,
  status: 'ACTIVE',
  closedAt: null,
  createdAt: new Date('2026-11-12T00:00:00.000Z'),
  updatedAt: new Date('2026-11-12T00:00:00.000Z'),
};

describe('AccountService.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects an unknown member with a readable 422', async () => {
    mockedMemberFindUnique.mockResolvedValue(null);

    await expect(
      new AccountService().create({ ...validInput, memberId: 'nope' })
    ).rejects.toMatchObject({
      status: 422,
      details: expect.objectContaining({ message: expect.any(String) }),
    } as Partial<HttpError>);

    expect(mockedAccountCreate).not.toHaveBeenCalled();
  });

  it('skips member validation when no memberId is provided', async () => {
    mockedMemberFindUnique.mockClear();
    mockedAccountCreate.mockResolvedValue(accountRow);

    await new AccountService().create({ ...validInput, memberId: undefined });

    expect(mockedMemberFindUnique).not.toHaveBeenCalled();
  });

  it('creates the account when the member exists', async () => {
    mockedMemberFindUnique.mockResolvedValue({ id: 'member-anco-0001' });
    mockedAccountCreate.mockResolvedValue(accountRow);

    const account = await new AccountService().create(validInput);

    expect(account.id).toBe('account-1');
  });
});

describe('AccountService — other methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds many accounts with query', async () => {
    (prisma.account.findMany as jest.Mock).mockResolvedValue([accountRow]);

    const accounts = await new AccountService().findMany({ limit: 10 });

    expect(accounts).toHaveLength(1);
    expect(accounts[0].id).toBe('account-1');
  });

  it('finds one account by id', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(accountRow);

    const account = await new AccountService().findOne('account-1');

    expect(account.id).toBe('account-1');
  });

  it('throws a readable 404 when the account does not exist', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(new AccountService().findOne('nope')).rejects.toMatchObject({
      status: 404,
    } as Partial<HttpError>);
  });

  it('updates an existing account', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(accountRow);
    (prisma.account.update as jest.Mock).mockResolvedValue({
      ...accountRow,
      name: 'Renommé',
    });

    const updated = await new AccountService().update('account-1', {
      name: 'Renommé',
    });

    expect(updated.name).toBe('Renommé');
  });

  it('rejects updating an unknown account with 404', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      new AccountService().update('nope', { name: 'X' })
    ).rejects.toMatchObject({ status: 404 } as Partial<HttpError>);
  });

  it('closes an existing account (status CLOSED + closedAt)', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(accountRow);
    (prisma.account.update as jest.Mock).mockResolvedValue({
      ...accountRow,
      status: 'CLOSED',
    });

    const closed = await new AccountService().close('account-1');

    expect(closed.status).toBe('CLOSED');
    expect(
      (prisma.account.update as jest.Mock).mock.calls[0][0].data
    ).toMatchObject({ status: 'CLOSED' });
  });

  it('rejects closing an unknown account with 404', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(new AccountService().close('nope')).rejects.toMatchObject({
      status: 404,
    } as Partial<HttpError>);
  });

  it('removes an account without related data', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      ...accountRow,
      transactions: [],
      snapshots: [],
      outgoingTransfers: [],
      charges: [],
    });

    await new AccountService().remove('account-1');

    expect(prisma.account.delete).toHaveBeenCalledWith({
      where: { id: 'account-1' },
    });
  });

  it('refuses to remove an account with existing data (409, close it instead)', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      ...accountRow,
      transactions: [{ id: 'tx-1' }],
      snapshots: [],
      outgoingTransfers: [],
      charges: [],
    });

    await expect(
      new AccountService().remove('account-1')
    ).rejects.toMatchObject({ status: 409 } as Partial<HttpError>);

    expect(prisma.account.delete).not.toHaveBeenCalled();
  });

  it('maps every updatable field through toPrisma (closedAt parsed)', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(accountRow);
    (prisma.account.update as jest.Mock).mockResolvedValue(accountRow);

    await new AccountService().update('account-1', {
      name: 'Renommé',
      bank: 'BCV',
      currency: 'EUR',
      accountType: 'SAVINGS',
      memberId: 'member-epouse-001',
      overdraftLimit: 500,
      deferredCard: true,
      billingDay: 5,
      openingBalance: 100,
      status: 'ACTIVE',
      closedAt: null,
    });

    const data = (prisma.account.update as jest.Mock).mock.calls[0][0].data;
    expect(data).toMatchObject({
      name: 'Renommé',
      overdraftLimit: 500,
      deferredCard: true,
      billingDay: 5,
      openingBalance: 100,
      closedAt: null,
    });
  });

  it('parses a non-null closedAt through toPrisma', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(accountRow);
    (prisma.account.update as jest.Mock).mockResolvedValue(accountRow);

    await new AccountService().update('account-1', {
      closedAt: '2026-11-13',
    });

    const data = (prisma.account.update as jest.Mock).mock.calls[0][0].data;
    expect(data.closedAt).toBeInstanceOf(Date);
  });

  it('passes the cursor through to findMany', async () => {
    (prisma.account.findMany as jest.Mock).mockResolvedValue([]);

    await new AccountService().findMany({ cursor: 'account-1', limit: 5 });

    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: 'account-1' }, take: 5 })
    );
  });
});
