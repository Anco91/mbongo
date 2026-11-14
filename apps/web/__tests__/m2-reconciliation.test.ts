/**
 * M2 tests for reconciliation (payment service) and auto-unlink on
 * transaction deletion (transaction service).
 *
 * @module Tests/Payments/M2Reconciliation
 * @jest-environment node
 */
import { PaymentService } from '@/server/payments/payment.service';
import { TransactionService } from '@/server/transactions/transaction.service';
import { HttpError } from '@/server/common/http';

jest.mock('@/server/db', () => ({
  prisma: {
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    transaction: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/server/db';

const mockedPaymentFindUnique = prisma.payment.findUnique as jest.Mock;
const mockedPaymentUpdate = prisma.payment.update as jest.Mock;
const mockedTransactionFindUnique = prisma.transaction.findUnique as jest.Mock;
const mockedPaymentUpdateMany = prisma.payment.updateMany as jest.Mock;
const mockedTransactionDelete = prisma.transaction.delete as jest.Mock;
const mockedTransaction = prisma.$transaction as jest.Mock;

const paymentRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'payment-1',
  chargeId: 'charge-1',
  amount: 312,
  currency: 'EUR',
  dueDate: new Date('2026-12-28T00:00:00.000Z'),
  status: 'PENDING',
  paidAt: null,
  transactionId: null,
  createdAt: new Date('2026-11-01T00:00:00.000Z'),
  updatedAt: new Date('2026-11-01T00:00:00.000Z'),
  ...overrides,
});

describe('PaymentService.reconcile (M2 spec payment-schedule)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('links the transaction, marks PAID and sets paidAt', async () => {
    mockedPaymentFindUnique
      .mockResolvedValueOnce(paymentRow())
      .mockResolvedValueOnce(null);
    mockedTransactionFindUnique.mockResolvedValue({ id: 'txn-1' });
    mockedPaymentUpdate.mockResolvedValue(
      paymentRow({ status: 'PAID', transactionId: 'txn-1' })
    );

    const payment = await new PaymentService().reconcile('payment-1', 'txn-1');

    expect(mockedPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({
        transactionId: 'txn-1',
        status: 'PAID',
        paidAt: expect.any(Date),
      }),
    });
    expect(payment.status).toBe('PAID');
    expect(payment.transactionId).toBe('txn-1');
  });

  it('rejects an unknown transaction with a readable 422', async () => {
    mockedPaymentFindUnique.mockResolvedValue(paymentRow());
    mockedTransactionFindUnique.mockResolvedValue(null);

    await expect(
      new PaymentService().reconcile('payment-1', 'nope')
    ).rejects.toMatchObject({
      status: 422,
      details: expect.objectContaining({ message: expect.any(String) }),
    } as Partial<HttpError>);

    expect(mockedPaymentUpdate).not.toHaveBeenCalled();
  });

  it('rejects a transaction already reconciled to another payment (409)', async () => {
    mockedPaymentFindUnique
      .mockResolvedValueOnce(paymentRow())
      .mockResolvedValueOnce(paymentRow({ id: 'payment-other' }));
    mockedTransactionFindUnique.mockResolvedValue({ id: 'txn-1' });

    await expect(
      new PaymentService().reconcile('payment-1', 'txn-1')
    ).rejects.toMatchObject({
      status: 409,
      details: expect.objectContaining({ message: expect.any(String) }),
    } as Partial<HttpError>);

    expect(mockedPaymentUpdate).not.toHaveBeenCalled();
  });

  it('reconciles a payment already PAID by manual check (link + paidAt refresh)', async () => {
    mockedPaymentFindUnique
      .mockResolvedValueOnce(paymentRow({ status: 'PAID', paidAt: new Date('2026-11-20T00:00:00.000Z') }))
      .mockResolvedValueOnce(null);
    mockedTransactionFindUnique.mockResolvedValue({ id: 'txn-1' });
    mockedPaymentUpdate.mockResolvedValue(
      paymentRow({ status: 'PAID', transactionId: 'txn-1' })
    );

    await new PaymentService().reconcile('payment-1', 'txn-1');

    expect(mockedPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: expect.objectContaining({ transactionId: 'txn-1', status: 'PAID' }),
    });
  });
});

describe('PaymentService.unlink (M2 spec payment-schedule)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the payment to PENDING without paidAt', async () => {
    mockedPaymentFindUnique.mockResolvedValue(
      paymentRow({ status: 'PAID', transactionId: 'txn-1' })
    );
    mockedPaymentUpdate.mockResolvedValue(paymentRow());

    const payment = await new PaymentService().unlink('payment-1');

    expect(mockedPaymentUpdate).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: { transactionId: null, status: 'PENDING', paidAt: null },
    });
    expect(payment.status).toBe('PENDING');
  });

  it('rejects unlinking a payment with no reconciliation (409)', async () => {
    mockedPaymentFindUnique.mockResolvedValue(paymentRow());

    await expect(new PaymentService().unlink('payment-1')).rejects.toMatchObject(
      { status: 409 } as Partial<HttpError>
    );
  });
});

describe('TransactionService.remove — auto-unlink (M2 spec payment-schedule)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedTransaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      fn(prisma)
    );
  });

  it('unreconciles the linked payment and deletes the transaction', async () => {
    mockedTransactionFindUnique.mockResolvedValue({
      id: 'txn-1',
      transferId: null,
    });

    await new TransactionService().remove('txn-1');

    expect(mockedPaymentUpdateMany).toHaveBeenCalledWith({
      where: { transactionId: 'txn-1' },
      data: { transactionId: null, status: 'PENDING', paidAt: null },
    });
    expect(mockedTransactionDelete).toHaveBeenCalledWith({
      where: { id: 'txn-1' },
    });
  });

  it('still refuses to delete a transfer transaction (409, no unlink)', async () => {
    mockedTransactionFindUnique.mockResolvedValue({
      id: 'txn-1',
      transferId: 'transfer-1',
    });

    await expect(new TransactionService().remove('txn-1')).rejects.toMatchObject(
      { status: 409 } as Partial<HttpError>
    );

    expect(mockedPaymentUpdateMany).not.toHaveBeenCalled();
    expect(mockedTransactionDelete).not.toHaveBeenCalled();
  });
});
