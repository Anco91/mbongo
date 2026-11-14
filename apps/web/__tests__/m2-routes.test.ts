/**
 * M2 API route tests — reconciliation endpoints status code contracts.
 *
 * POST /api/payments/{id}/reconcile  → 200 / 409 / 422
 * POST /api/payments/{id}/unlink     → 200 / 409 / 404
 * DELETE /api/transactions/{id}      → 204 with payment auto-unlink
 *
 * @module Tests/API/M2Routes
 * @jest-environment node
 */

jest.mock('@/server/db', () => ({
  prisma: {
    payment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    transaction: { findUnique: jest.fn(), delete: jest.fn() },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/server/db';
import { POST as postReconcile } from '@/app/api/payments/[id]/reconcile/route';
import { POST as postUnlink } from '@/app/api/payments/[id]/unlink/route';
import { DELETE as deleteTransaction } from '@/app/api/transactions/[id]/route';

const jsonRequest = (body: unknown): Request =>
  new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

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

const ctx = { params: Promise.resolve({ id: 'payment-1' }) };
const txCtx = { params: Promise.resolve({ id: 'txn-1' }) };

beforeEach(() => {
  jest.resetAllMocks();
});

describe('POST /api/payments/{id}/reconcile', () => {
  it('returns 200 with the reconciled payment', async () => {
    (prisma.payment.findUnique as jest.Mock)
      .mockResolvedValueOnce(paymentRow())
      .mockResolvedValueOnce(null);
    (prisma.transaction.findUnique as jest.Mock).mockResolvedValue({ id: 'txn-1' });
    (prisma.payment.update as jest.Mock).mockResolvedValue(
      paymentRow({ status: 'PAID', transactionId: 'txn-1', paidAt: new Date() })
    );

    const response = await postReconcile(
      jsonRequest({ transactionId: 'txn-1' }),
      ctx
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({ status: 'PAID', transactionId: 'txn-1' });
  });

  it('returns 422 for an unknown transaction', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(paymentRow());
    (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await postReconcile(
      jsonRequest({ transactionId: 'nope' }),
      ctx
    );

    expect(response.status).toBe(422);
  });

  it('returns 409 when the transaction is already reconciled', async () => {
    (prisma.payment.findUnique as jest.Mock)
      .mockResolvedValueOnce(paymentRow())
      .mockResolvedValueOnce(paymentRow({ id: 'payment-other' }));
    (prisma.transaction.findUnique as jest.Mock).mockResolvedValue({ id: 'txn-1' });

    const response = await postReconcile(
      jsonRequest({ transactionId: 'txn-1' }),
      ctx
    );

    expect(response.status).toBe(409);
  });

  it('returns 400 on a malformed body', async () => {
    const response = await postReconcile(jsonRequest({}), ctx);
    expect(response.status).toBe(400);
  });
});

describe('POST /api/payments/{id}/unlink', () => {
  it('returns 200 with the payment back to PENDING', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(
      paymentRow({ status: 'PAID', transactionId: 'txn-1' })
    );
    (prisma.payment.update as jest.Mock).mockResolvedValue(paymentRow());

    const response = await postUnlink(new Request('http://localhost/api'), ctx);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({ status: 'PENDING', transactionId: null });
  });

  it('returns 409 when there is no reconciliation to undo', async () => {
    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(paymentRow());

    const response = await postUnlink(new Request('http://localhost/api'), ctx);

    expect(response.status).toBe(409);
  });
});

describe('DELETE /api/transactions/{id} — auto-unlink', () => {
  it('unreconciles the payment and returns 204', async () => {
    (prisma.transaction.findUnique as jest.Mock).mockResolvedValue({
      id: 'txn-1',
      transferId: null,
    });
    (prisma.$transaction as jest.Mock).mockImplementation(
      (fn: (tx: unknown) => unknown) => fn(prisma)
    );

    const response = await deleteTransaction(
      new Request('http://localhost/api', { method: 'DELETE' }),
      txCtx
    );

    expect(response.status).toBe(204);
    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: { transactionId: 'txn-1' },
      data: { transactionId: null, status: 'PENDING', paidAt: null },
    });
  });
});
