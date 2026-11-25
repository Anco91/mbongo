/**
 * TransferService — external transfer boundaries (spec 37): created
 * COMPLETED with the SOURCE leg only, closed source refused (422), and no
 * reception possible (409).
 *
 * @module Tests/Transfers/TransferExternalService
 * @jest-environment node
 */
import { TransferService } from '@/server/transfers/transfer.service';

jest.mock('@/server/db', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    transfer: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    transaction: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/server/db';

const mockedAccount = prisma.account.findUnique as jest.Mock;
const mockedCreate = prisma.transfer.create as jest.Mock;
const mockedFindUnique = prisma.transfer.findUnique as jest.Mock;
const mockedTxCreate = prisma.transaction.create as jest.Mock;
const mockedDbTransaction = prisma.$transaction as jest.Mock;

const DAY = new Date('2026-11-03T00:00:00.000Z');
const stored = (overrides: Record<string, unknown> = {}) => ({
  id: 'tr-ext',
  sourceAccountId: 'acc-eur',
  targetAccountId: null,
  externalLabel: 'Carla',
  amountSent: 1300,
  rateEstimated: 1,
  rateDate: DAY,
  amountReceived: null,
  rateEffective: null,
  fees: null,
  memo: 'CHARGES MAISON',
  status: 'COMPLETED',
  sentAt: DAY,
  receivedAt: null,
  createdAt: DAY,
  updatedAt: DAY,
  ...overrides,
});

const input = {
  sourceAccountId: 'acc-eur',
  targetAccountId: null,
  externalLabel: 'Carla',
  amountSent: 1300,
  rateEstimated: 1,
  rateDate: '2026-11-03',
  sentAt: '2026-11-03',
  memo: 'CHARGES MAISON',
};

describe('TransferService external transfer', () => {
  const service = new TransferService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedDbTransaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma)
    );
  });

  it('creates it COMPLETED with the source leg only', async () => {
    mockedAccount.mockResolvedValue({
      id: 'acc-eur',
      currency: 'EUR',
      status: 'ACTIVE',
    });
    mockedCreate.mockResolvedValue(stored());

    const created = await service.create(input);

    expect(created.targetAccountId).toBeNull();
    expect(mockedCreate.mock.calls[0][0].data.status).toBe('COMPLETED');
    expect(mockedTxCreate).toHaveBeenCalledTimes(1);
    expect(mockedTxCreate.mock.calls[0][0].data).toMatchObject({
      accountId: 'acc-eur',
      amount: -1300,
      transferRole: 'SOURCE',
    });
  });

  it('refuses a closed source account with 422 and writes nothing', async () => {
    mockedAccount.mockResolvedValue({
      id: 'acc-eur',
      currency: 'EUR',
      status: 'CLOSED',
    });

    await expect(service.create(input)).rejects.toMatchObject({ status: 422 });
    expect(mockedCreate).not.toHaveBeenCalled();
    expect(mockedTxCreate).not.toHaveBeenCalled();
  });

  it('refuses a reception on an external transfer with 409', async () => {
    mockedFindUnique.mockResolvedValue(stored({ status: 'ESTIMATED' }));

    await expect(
      service.update('tr-ext', {
        amountReceived: 1300,
        receivedAt: '2026-11-04T00:00:00.000Z',
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(mockedTxCreate).not.toHaveBeenCalled();
  });
});
