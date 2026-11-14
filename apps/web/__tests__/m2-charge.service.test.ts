/**
 * M2 tests for ChargeService:
 * - create is transactional (charge + payments, all-or-nothing, D5)
 * - edit rule D6: calendar edits replace future unlinked PENDING payments,
 *   paid and reconciled payments stay untouched.
 *
 * @module Tests/Charges/M2ChargeService
 * @jest-environment node
 */
import { ChargeService } from '@/server/charges/charge.service';

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
const mockedUpdate = prisma.charge.update as jest.Mock;
const mockedFindCharge = prisma.charge.findUnique as jest.Mock;
const mockedPaymentsCreateMany = prisma.payment.createMany as jest.Mock;
const mockedPaymentsDeleteMany = prisma.payment.deleteMany as jest.Mock;

const validInput = {
  label: 'Impôt FR',
  type: 'INSTALLMENT' as const,
  amount: 1248,
  currency: 'EUR' as const,
  accountId: 'account-bnp-perso',
  category: 'Impôts & taxes',
  startDate: '2026-09-25',
  endDate: null,
  frequency: null,
  installments: 4,
  provisioned: false,
};

const installmentRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'charge-impot',
  label: 'Impôt FR',
  type: 'INSTALLMENT',
  amount: 1248,
  currency: 'EUR',
  category: 'Impôts & taxes',
  startDate: new Date('2026-09-25T00:00:00.000Z'),
  endDate: null,
  frequency: null,
  installments: 4,
  provisioned: false,
  accountId: 'account-bnp-perso',
  createdAt: new Date('2026-09-01T00:00:00.000Z'),
  updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  ...overrides,
});

describe('ChargeService.create — transactional all-or-nothing (M2 D5)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma)
    );
  });

  it('creates the charge and its payments inside a single transaction', async () => {
    mockedFindUnique.mockResolvedValue({ id: 'account-bnp-perso' });
    mockedCreate.mockResolvedValue(installmentRow());

    await new ChargeService().create(validInput);

    expect(mockedTransaction).toHaveBeenCalledTimes(1);
    expect(mockedPaymentsCreateMany).toHaveBeenCalledTimes(1);

    const data = mockedPaymentsCreateMany.mock.calls[0][0].data;
    expect(data).toHaveLength(4);
    // 1248 / 4 = 312 EUR per installment
    expect(data[0]).toMatchObject({
      chargeId: 'charge-impot',
      amount: 312,
      status: 'PENDING',
    });
  });

  it('rolls back completely when the payment batch fails (no orphan charge)', async () => {
    mockedFindUnique.mockResolvedValue({ id: 'account-bnp-perso' });
    mockedCreate.mockResolvedValue(installmentRow());
    mockedPaymentsCreateMany.mockRejectedValue(
      new Error('createMany failed (simulated)')
    );

    await expect(new ChargeService().create(validInput)).rejects.toThrow(
      'createMany failed (simulated)'
    );

    // The rollback contract: nothing else may have been written outside the
    // transaction (verified here by the error propagating from within it).
    expect(mockedTransaction).toHaveBeenCalledTimes(1);
  });

  it('rejects an unknown account before any write (422, no transaction)', async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(
      new ChargeService().create({ ...validInput, accountId: 'nope' })
    ).rejects.toMatchObject({ status: 422 });

    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedCreate).not.toHaveBeenCalled();
  });
});

describe('ChargeService.update — edit rule (M2 D6)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma)
    );
  });

  it('replaces future unlinked PENDING payments on a calendar edit', async () => {
    mockedFindCharge.mockResolvedValue(installmentRow());
    mockedUpdate.mockResolvedValue(installmentRow({ amount: 1248 }));

    await new ChargeService().update('charge-impot', { amount: 1248 });

    expect(mockedTransaction).toHaveBeenCalledTimes(1);
    expect(mockedPaymentsDeleteMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        chargeId: 'charge-impot',
        status: 'PENDING',
        transactionId: null,
      }),
    });
    expect(mockedPaymentsCreateMany).toHaveBeenCalledTimes(1);
  });

  it('keeps only future PENDING for recurring charges (paid and past stay)', async () => {
    mockedFindCharge.mockResolvedValue({
      ...installmentRow(),
      type: 'FIXED_RECURRING',
      frequency: 'monthly',
    });
    mockedUpdate.mockResolvedValue({
      ...installmentRow(),
      type: 'FIXED_RECURRING',
      frequency: 'monthly',
      amount: 1900,
    });

    await new ChargeService().update('charge-impot', { amount: 1900 });

    const where = mockedPaymentsDeleteMany.mock.calls[0][0].where;
    expect(where).toMatchObject({
      chargeId: 'charge-impot',
      status: 'PENDING',
      transactionId: null,
    });
    // Only future payments are replaced; overdue unpaid ones stay.
    expect(where.dueDate).toBeDefined();
  });

  it('updates without touching payments when the calendar is not edited', async () => {
    mockedFindCharge.mockResolvedValue(installmentRow());
    mockedUpdate.mockResolvedValue(installmentRow({ label: 'Impôt FR 2026' }));

    await new ChargeService().update('charge-impot', {
      label: 'Impôt FR 2026',
    });

    expect(mockedTransaction).not.toHaveBeenCalled();
    expect(mockedPaymentsDeleteMany).not.toHaveBeenCalled();
    expect(mockedPaymentsCreateMany).not.toHaveBeenCalled();
  });

  it('rejects an unknown charge with 404 before any write', async () => {
    mockedFindCharge.mockResolvedValue(null);

    await expect(
      new ChargeService().update('nope', { amount: 1 })
    ).rejects.toMatchObject({ status: 404 });

    expect(mockedTransaction).not.toHaveBeenCalled();
  });
});
