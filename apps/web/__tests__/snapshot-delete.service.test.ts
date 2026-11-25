/**
 * Tests for SnapshotService.delete (spec 47).
 *
 * Only the targeted row is removed; an unknown id is a 404 without any delete.
 *
 * @module Tests/Snapshots/SnapshotDelete
 * @jest-environment node
 */
import { SnapshotService } from '@/server/snapshots/snapshot.service';
import { NotFoundError } from '@/server/common/http';

jest.mock('@/server/db', () => ({
  prisma: {
    balanceSnapshot: {
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/server/db';

const findUnique = prisma.balanceSnapshot.findUnique as jest.Mock;
const del = prisma.balanceSnapshot.delete as jest.Mock;
const deleteMany = prisma.balanceSnapshot.deleteMany as jest.Mock;

describe('SnapshotService.delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes exactly the snapshot with the given id', async () => {
    findUnique.mockResolvedValue({ id: 'snap-1' });
    del.mockResolvedValue({ id: 'snap-1' });

    await expect(
      new SnapshotService().delete('snap-1')
    ).resolves.toBeUndefined();

    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith({ where: { id: 'snap-1' } });
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('throws NotFoundError for an unknown id and deletes nothing', async () => {
    findUnique.mockResolvedValue(null);

    await expect(new SnapshotService().delete('nope')).rejects.toBeInstanceOf(
      NotFoundError
    );

    expect(del).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });
});
