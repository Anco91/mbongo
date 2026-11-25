/**
 * Tests for ChargeService owner rules on create and update:
 * own account / another member / common, and the 422 refusals.
 *
 * @module Tests/Charges/ChargeOwnerService
 * @jest-environment node
 */
import { ChargeService } from '@/server/charges/charge.service';

jest.mock('@/server/db', () => ({
  prisma: {
    $transaction: jest.fn(),
    account: { findUnique: jest.fn() },
    member: { findUnique: jest.fn() },
    charge: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: { createMany: jest.fn(), deleteMany: jest.fn() },
  },
}));

import { prisma } from '@/server/db';

const findAccount = prisma.account.findUnique as jest.Mock;
const findMember = prisma.member.findUnique as jest.Mock;
const findCharge = prisma.charge.findUnique as jest.Mock;
const createCharge = prisma.charge.create as jest.Mock;
const updateCharge = prisma.charge.update as jest.Mock;

const input = {
  label: 'Assurance',
  type: 'FIXED_RECURRING' as const,
  amount: 100,
  currency: 'CHF' as const,
  accountId: 'acc-1',
  category: 'Logement',
  startDate: '2026-11-01',
  endDate: null,
  frequency: 'monthly' as const,
  installments: null,
  provisioned: false,
};

const row = {
  id: 'charge-1',
  label: 'Assurance',
  type: 'FIXED_RECURRING',
  amount: 100,
  currency: 'CHF',
  category: 'Logement',
  subcategory: null,
  startDate: new Date('2026-11-01T00:00:00.000Z'),
  endDate: null,
  frequency: 'monthly',
  installments: null,
  dueDay: null,
  provisioned: false,
  accountId: 'acc-1',
  memberId: null,
  shared: false,
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  updatedAt: new Date('2026-11-01T00:00:00.000Z'),
};

beforeEach(() => {
  jest.clearAllMocks();
  (prisma.$transaction as jest.Mock).mockImplementation(
    (fn: (tx: unknown) => unknown) => fn(prisma)
  );
  findAccount.mockResolvedValue({ id: 'acc-1' });
  findMember.mockResolvedValue({ id: 'member-2' });
  createCharge.mockResolvedValue(row);
  updateCharge.mockResolvedValue(row);
  findCharge.mockResolvedValue(row);
});

describe('ChargeService.create — owner', () => {
  it('defaults to the account owner: no member, not shared', async () => {
    await new ChargeService().create(input);

    expect(createCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ memberId: null, shared: false }),
      })
    );
  });

  it('stores another member as owner', async () => {
    await new ChargeService().create({ ...input, memberId: 'member-2' });

    expect(createCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ memberId: 'member-2', shared: false }),
      })
    );
  });

  it('stores a common charge with no member', async () => {
    await new ChargeService().create({ ...input, shared: true });

    expect(createCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ memberId: null, shared: true }),
      })
    );
  });

  it('refuses a common charge with an owner member (422)', async () => {
    await expect(
      new ChargeService().create({
        ...input,
        shared: true,
        memberId: 'member-2',
      })
    ).rejects.toMatchObject({ status: 422 });
    expect(createCharge).not.toHaveBeenCalled();
  });

  it('refuses an unknown owner member (422)', async () => {
    findMember.mockResolvedValue(null);

    await expect(
      new ChargeService().create({ ...input, memberId: 'ghost' })
    ).rejects.toMatchObject({ status: 422 });
    expect(createCharge).not.toHaveBeenCalled();
  });
});

describe('ChargeService.update — owner', () => {
  it('switches to another member', async () => {
    await new ChargeService().update('charge-1', { memberId: 'member-2' });

    expect(updateCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ memberId: 'member-2' }),
      })
    );
  });

  it('switches to common when sent with a cleared member', async () => {
    findCharge.mockResolvedValue({ ...row, memberId: 'member-2' });

    await new ChargeService().update('charge-1', {
      memberId: null,
      shared: true,
    });

    expect(updateCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ memberId: null, shared: true }),
      })
    );
  });

  it('goes back to the account owner', async () => {
    findCharge.mockResolvedValue({ ...row, shared: true });

    await new ChargeService().update('charge-1', {
      memberId: null,
      shared: false,
    });

    expect(updateCharge).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ memberId: null, shared: false }),
      })
    );
  });

  it('refuses a member on an already common charge (422)', async () => {
    findCharge.mockResolvedValue({ ...row, shared: true });

    await expect(
      new ChargeService().update('charge-1', { memberId: 'member-2' })
    ).rejects.toMatchObject({ status: 422 });
    expect(updateCharge).not.toHaveBeenCalled();
  });

  it('leaves the owner untouched when the input omits it', async () => {
    findCharge.mockResolvedValue({ ...row, memberId: 'member-2' });

    await new ChargeService().update('charge-1', { label: 'Nouveau' });

    const data = updateCharge.mock.calls[0][0].data;
    expect(data).not.toHaveProperty('memberId');
    expect(data).not.toHaveProperty('shared');
  });
});
