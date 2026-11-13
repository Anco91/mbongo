/**
 * Tests for SnapshotService.create — account pre-validation.
 *
 * Unknown accounts produce a readable 422, never a raw FK 500.
 *
 * @module Tests/Snapshots/SnapshotService
 * @jest-environment node
 */
import { SnapshotService } from '@/server/snapshots/snapshot.service';
import { HttpError } from '@/server/common/http';

jest.mock('@/server/db', () => ({
  prisma: {
    account: { findUnique: jest.fn() },
    balanceSnapshot: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/server/db';

const mockedFindUnique = prisma.account.findUnique as jest.Mock;
const mockedCreate = prisma.balanceSnapshot.create as jest.Mock;

const validInput = {
  accountId: 'account-ubs-courant',
  date: '2026-11-12',
  balance: 4230.5,
  note: 'Ancre manuelle',
};

const snapshotRow = {
  id: 'snapshot-1',
  accountId: 'account-ubs-courant',
  date: new Date('2026-11-12T00:00:00.000Z'),
  balance: 4230.5,
  note: 'Ancre manuelle',
  createdAt: new Date('2026-11-12T00:00:00.000Z'),
  updatedAt: new Date('2026-11-12T00:00:00.000Z'),
};

describe('SnapshotService.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects an unknown account with a readable 422', async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(
      new SnapshotService().create({ ...validInput, accountId: 'nope' })
    ).rejects.toMatchObject({
      status: 422,
      details: expect.objectContaining({ message: expect.any(String) }),
    } as Partial<HttpError>);

    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('creates the snapshot when the account exists', async () => {
    mockedFindUnique.mockResolvedValue({ id: 'account-ubs-courant' });
    mockedCreate.mockResolvedValue(snapshotRow);

    const snapshot = await new SnapshotService().create(validInput);

    expect(snapshot.id).toBe('snapshot-1');
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'account-ubs-courant',
          balance: 4230.5,
        }),
      })
    );
  });
});

describe('SnapshotService — other methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds many snapshots with query', async () => {
    (prisma.balanceSnapshot.findMany as jest.Mock).mockResolvedValue([
      snapshotRow,
    ]);

    const rows = await new SnapshotService().findMany({});

    expect(rows).toHaveLength(1);
  });

  it('finds one snapshot by id', async () => {
    (prisma.balanceSnapshot.findUnique as jest.Mock).mockResolvedValue(
      snapshotRow
    );

    const row = await new SnapshotService().findOne('snapshot-1');

    expect(row.id).toBe('snapshot-1');
  });

  it('throws a readable 404 when the snapshot does not exist', async () => {
    (prisma.balanceSnapshot.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(new SnapshotService().findOne('nope')).rejects.toMatchObject({
      status: 404,
    } as Partial<HttpError>);
  });

  it('passes the cursor through to findMany', async () => {
    (prisma.balanceSnapshot.findMany as jest.Mock).mockResolvedValue([]);

    await new SnapshotService().findMany({ cursor: 'snapshot-1', limit: 5 });

    expect(prisma.balanceSnapshot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: 'snapshot-1' }, take: 5 })
    );
  });

  it('persists an explicit null note on create', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue({
      id: 'account-ubs-courant',
    });
    (prisma.balanceSnapshot.create as jest.Mock).mockResolvedValue({
      ...snapshotRow,
      note: null,
    });

    await new SnapshotService().create({
      accountId: 'account-ubs-courant',
      date: '2026-11-12',
      balance: 100,
      note: null,
    });

    const data = (prisma.balanceSnapshot.create as jest.Mock).mock.calls[0][0]
      .data;
    expect(data.note).toBeNull();
  });
});
