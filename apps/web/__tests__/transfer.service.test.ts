/**
 * TransferService — completion and closing boundaries.
 *
 * A closed transfer can no longer be completed (409, no write); closing is
 * idempotent and never touches transactions.
 *
 * @module Tests/Transfers/TransferService
 * @jest-environment node
 */
import { TransferService } from '@/server/transfers/transfer.service';
import { HttpError, NotFoundError } from '@/server/common/http';

jest.mock('@/server/db', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    transfer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    transaction: { create: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/server/db';

const mockedFindUnique = prisma.transfer.findUnique as jest.Mock;
const mockedUpdate = prisma.transfer.update as jest.Mock;
const mockedTxCreate = prisma.transaction.create as jest.Mock;
const mockedDbTransaction = prisma.$transaction as jest.Mock;

function row(status: string): Record<string, unknown> {
  return {
    id: 'tr-1',
    sourceAccountId: 'acc-chf',
    targetAccountId: 'acc-eur',
    amountSent: 1000,
    rateEstimated: 0.92,
    rateDate: new Date('2026-11-01T00:00:00.000Z'),
    amountReceived: null,
    rateEffective: null,
    fees: null,
    memo: null,
    status,
    sentAt: new Date('2026-11-01T00:00:00.000Z'),
    receivedAt: null,
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
  };
}

const completion = {
  amountReceived: 920,
  receivedAt: '2026-11-05T00:00:00.000Z',
};

describe('TransferService.update (completion)', () => {
  const service = new TransferService();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedDbTransaction.mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) =>
        callback(prisma)
    );
  });

  it('refuses a CLOSED transfer with 409 and writes nothing', async () => {
    mockedFindUnique.mockResolvedValue(row('CLOSED'));

    await expect(service.update('tr-1', completion)).rejects.toMatchObject({
      status: 409,
    });
    await expect(service.update('tr-1', completion)).rejects.toBeInstanceOf(
      HttpError
    );
    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(mockedTxCreate).not.toHaveBeenCalled();
  });

  it('still refuses a COMPLETED transfer with 409', async () => {
    mockedFindUnique.mockResolvedValue(row('COMPLETED'));

    await expect(service.update('tr-1', completion)).rejects.toMatchObject({
      status: 409,
    });
    expect(mockedTxCreate).not.toHaveBeenCalled();
  });
});

describe('TransferService.close', () => {
  const service = new TransferService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['ESTIMATED', 'COMPLETED'])(
    'closes a %s transfer without touching transactions',
    async (status) => {
      mockedFindUnique.mockResolvedValue(row(status));
      mockedUpdate.mockResolvedValue(row('CLOSED'));

      const result = await service.close('tr-1');

      expect(mockedUpdate).toHaveBeenCalledWith({
        where: { id: 'tr-1' },
        data: { status: 'CLOSED' },
      });
      expect(mockedTxCreate).not.toHaveBeenCalled();
      expect(result.status).toBe('CLOSED');
    }
  );

  it('returns an already CLOSED transfer without writing', async () => {
    mockedFindUnique.mockResolvedValue(row('CLOSED'));

    const result = await service.close('tr-1');

    expect(result.status).toBe('CLOSED');
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it('throws NotFoundError for an unknown transfer', async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(service.close('nope')).rejects.toBeInstanceOf(NotFoundError);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });
});
