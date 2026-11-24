/**
 * Tests for ChargeService.create — account pre-validation.
 *
 * The FK bug (P2003 → raw 500) is fixed by validating the referenced
 * account before writing, with a readable 422 for unknown accounts.
 *
 * @module Tests/Charges/ChargeService
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
const mockedFindUnique = prisma.account.findUnique as jest.Mock;
const mockedCreate = prisma.charge.create as jest.Mock;

const validInput = {
  label: 'Loyer GE',
  type: 'FIXED_RECURRING' as const,
  amount: 1850,
  currency: 'CHF' as const,
  accountId: 'account-ubs-courant',
  category: 'Logement',
  startDate: '2026-11-01',
  endDate: null,
  frequency: 'monthly' as const,
  installments: null,
  provisioned: false,
};

const chargeRow = {
  id: 'charge-1',
  label: 'Loyer GE',
  type: 'FIXED_RECURRING',
  amount: 1850,
  currency: 'CHF',
  category: 'Logement',
  startDate: new Date('2026-11-01T00:00:00.000Z'),
  endDate: null,
  frequency: 'monthly',
  installments: null,
  dueDay: null,
  provisioned: false,
  accountId: 'account-ubs-courant',
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  updatedAt: new Date('2026-11-01T00:00:00.000Z'),
};

describe('ChargeService.create', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Le client Prisma transmis à la transaction EST le mock prisma lui-même.
    mockedTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma)
    );
  });

  it('rejects an unknown account with a readable 422', async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(
      new ChargeService().create({ ...validInput, accountId: 'nope' })
    ).rejects.toMatchObject({
      status: 422,
      details: expect.objectContaining({ message: expect.any(String) }),
    } as Partial<HttpError>);

    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('creates the charge when the account exists', async () => {
    mockedFindUnique.mockResolvedValue({ id: 'account-ubs-courant' });
    mockedCreate.mockResolvedValue(chargeRow);

    const charge = await new ChargeService().create(validInput);

    expect(charge.id).toBe('charge-1');
    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          accountId: 'account-ubs-courant',
          label: 'Loyer GE',
        }),
      })
    );
  });
});

describe('ChargeService — other methods', () => {
  const row = {
    ...chargeRow,
    id: 'charge-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma)
    );
  });

  it('finds many charges with query', async () => {
    (prisma.charge.findMany as jest.Mock).mockResolvedValue([row]);

    const charges = await new ChargeService().findMany({ limit: 10 });

    expect(charges).toHaveLength(1);
    expect(charges[0].id).toBe('charge-1');
  });

  it('finds one charge by id', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(row);

    const charge = await new ChargeService().findOne('charge-1');

    expect(charge.id).toBe('charge-1');
  });

  it('throws a readable 404 when the charge does not exist', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(new ChargeService().findOne('nope')).rejects.toMatchObject({
      status: 404,
    } as Partial<HttpError>);
  });

  it('updates an existing charge', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(row);
    (prisma.charge.update as jest.Mock).mockResolvedValue({
      ...row,
      amount: 1900,
    });

    const updated = await new ChargeService().update('charge-1', {
      amount: 1900,
    });

    expect(updated.amount).toBe(1900);
  });

  it('rejects updating an unknown charge with 404', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      new ChargeService().update('nope', { amount: 1 })
    ).rejects.toMatchObject({ status: 404 } as Partial<HttpError>);
  });

  it('removes an existing charge', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(row);
    (prisma.charge.delete as jest.Mock).mockResolvedValue(row);

    await new ChargeService().remove('charge-1');

    expect(prisma.charge.delete).toHaveBeenCalledWith({
      where: { id: 'charge-1' },
    });
  });

  it('rejects removing an unknown charge with 404', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(new ChargeService().remove('nope')).rejects.toMatchObject({
      status: 404,
    } as Partial<HttpError>);
  });

  it('maps every updatable field through toPrisma (dates parsed)', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(row);
    (prisma.charge.update as jest.Mock).mockResolvedValue(row);

    await new ChargeService().update('charge-1', {
      label: 'Loyer GE 2027',
      type: 'TEMPORARY',
      amount: 1900,
      currency: 'EUR',
      category: 'Divers',
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      frequency: 'yearly',
      installments: 6,
      provisioned: true,
      accountId: 'account-bnp-perso',
    });

    const data = (prisma.charge.update as jest.Mock).mock.calls[0][0].data;
    expect(data.startDate).toBeInstanceOf(Date);
    expect(data.endDate).toBeInstanceOf(Date);
    expect(data).toMatchObject({
      label: 'Loyer GE 2027',
      installments: 6,
      provisioned: true,
    });
  });

  it('clears the end date when updated to null', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(row);
    (prisma.charge.update as jest.Mock).mockResolvedValue(row);

    await new ChargeService().update('charge-1', { endDate: null });

    const data = (prisma.charge.update as jest.Mock).mock.calls[0][0].data;
    expect(data.endDate).toBeNull();
  });

  it('passes the cursor through to findMany', async () => {
    (prisma.charge.findMany as jest.Mock).mockResolvedValue([]);

    await new ChargeService().findMany({ cursor: 'charge-1', limit: 5 });

    expect(prisma.charge.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: 'charge-1' }, take: 5 })
    );
  });
});

describe('ChargeService — dueDay (design D4, tasks 4.4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma)
    );
  });

  it('persists dueDay at creation and generates due dates on the chosen day', async () => {
    mockedFindUnique.mockResolvedValue({ id: 'account-ubs-courant' });
    mockedCreate.mockResolvedValue({ ...chargeRow, dueDay: 5 });

    await new ChargeService().create({ ...validInput, dueDay: 5 });

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dueDay: 5 }),
      })
    );

    const createCall = (prisma.payment.createMany as jest.Mock).mock
      .calls[0][0] as { data: Array<{ dueDate: string | Date }> };
    const firstDay = new Date(createCall.data[0].dueDate).getDate();
    expect(firstDay).toBe(5);
  });

  it('regenerates the monthly calendar from the start of the current month on dueDay edit, keeping PAID and reconciled ones', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(chargeRow);
    (prisma.charge.update as jest.Mock).mockResolvedValue({
      ...chargeRow,
      dueDay: 5,
    });

    await new ChargeService().update('charge-1', { dueDay: 5 });

    const { where } = (prisma.payment.deleteMany as jest.Mock).mock
      .calls[0][0] as { where: { dueDate: { gte: Date } } };
    expect(where).toMatchObject({
      chargeId: 'charge-1',
      status: 'PENDING',
      transactionId: null,
    });
    // The anchor month is always regenerated: the lower bound is the
    // first day of the current month, not today.
    expect(where.dueDate.gte.getDate()).toBe(1);
    expect(where.dueDate.gte.getMonth()).toBe(new Date().getMonth());
  });

  it('rejects a due day on a non-monthly frequency with a 422', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(chargeRow);

    await expect(
      new ChargeService().update('charge-1', {
        frequency: 'yearly',
        dueDay: 5,
      })
    ).rejects.toMatchObject({ status: 422 } as Partial<HttpError>);

    expect(prisma.charge.update).not.toHaveBeenCalled();
  });

  it('accepts clearing dueDay (null) on any frequency', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue({
      ...chargeRow,
      dueDay: 5,
    });
    (prisma.charge.update as jest.Mock).mockResolvedValue(chargeRow);

    await new ChargeService().update('charge-1', { dueDay: null });

    const data = (prisma.charge.update as jest.Mock).mock.calls[0][0].data;
    expect(data.dueDay).toBeNull();
  });

  it('maps dueDay through toPrisma', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue(chargeRow);
    (prisma.charge.update as jest.Mock).mockResolvedValue({
      ...chargeRow,
      dueDay: 12,
    });

    await new ChargeService().update('charge-1', { dueDay: 12 });

    const data = (prisma.charge.update as jest.Mock).mock.calls[0][0].data;
    expect(data.dueDay).toBe(12);
  });

  it('exposes dueDay in the returned charge', async () => {
    (prisma.charge.findUnique as jest.Mock).mockResolvedValue({
      ...chargeRow,
      dueDay: 5,
    });

    const charge = await new ChargeService().findOne('charge-1');
    expect(charge.dueDay).toBe(5);
  });
});
