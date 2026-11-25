/**
 * MonthStartBalanceService — the server re-checks that every account exists
 * and is active before writing (spec 40).
 *
 * @module Tests/MonthStartBalances/Service
 * @jest-environment node
 */
import { MonthStartBalanceService } from '@/server/month-start-balances/month-start-balance.service';
import { BadRequestError, NotFoundError } from '@/server/common/http';

jest.mock('@/server/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    account: { findMany: jest.fn() },
    monthStartBalance: { findMany: jest.fn(), upsert: jest.fn() },
  },
}));

import { prisma } from '@/server/db';

const findAccounts = prisma.account.findMany as jest.Mock;
const findRows = prisma.monthStartBalance.findMany as jest.Mock;
const upsert = prisma.monthStartBalance.upsert as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;

const service = new MonthStartBalanceService();

beforeEach(() => {
  jest.clearAllMocks();
  findRows.mockResolvedValue([]);
  transaction.mockResolvedValue([]);
});

describe('MonthStartBalanceService.save', () => {
  it('rejects an unknown account and writes nothing', async () => {
    findAccounts.mockResolvedValue([]);

    await expect(
      service.save('2026-12', { balances: [{ accountId: 'x', balance: 10 }] })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects a closed account and writes nothing', async () => {
    findAccounts.mockResolvedValue([{ id: 'a1', status: 'CLOSED' }]);

    await expect(
      service.save('2026-12', { balances: [{ accountId: 'a1', balance: 10 }] })
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(transaction).not.toHaveBeenCalled();
  });

  it('upserts per (month, account) for active accounts', async () => {
    findAccounts.mockResolvedValue([{ id: 'a1', status: 'ACTIVE' }]);

    await service.save('2026-12', {
      balances: [{ accountId: 'a1', balance: 1800 }],
    });

    expect(upsert).toHaveBeenCalledWith({
      where: { month_accountId: { month: '2026-12', accountId: 'a1' } },
      update: { balance: 1800 },
      create: { month: '2026-12', accountId: 'a1', balance: 1800 },
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
