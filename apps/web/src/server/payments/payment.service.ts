import { NotFoundError, HttpError } from '@/server/common/http';
import { createWhereTranslator } from '@/server/common/where-translator';
import { prisma } from '@/server/db';
import {
  CreatePaymentInput,
  Payment,
  PaymentQuery,
  planPaymentDebit,
  UpdatePaymentInput,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';

const paymentWhereTranslator = createWhereTranslator<Prisma.PaymentWhereInput>({
  chargeId: { ops: ['eq', 'in'] },
  status: { ops: ['eq', 'in'] },
  dueDate: {
    ops: ['eq', 'gte', 'lte', 'gt', 'lt'],
    transform: (v) => (typeof v === 'string' ? parseISO(v) : v),
  },
  transactionId: { ops: ['eq', 'in'] },
});

/** Erreur Prisma d'unicité violée. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

export class PaymentService {
  async findMany(query: PaymentQuery): Promise<Payment[]> {
    const rows = await prisma.payment.findMany({
      where: paymentWhereTranslator(query as Record<string, unknown>),
      orderBy: { dueDate: 'asc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });
    return rows.map((row) => this.toPayment(row));
  }

  async findOne(id: string): Promise<Payment> {
    const row = await prisma.payment.findUnique({ where: { id } });
    if (!row) throw new NotFoundError('Payment', id);
    return this.toPayment(row);
  }

  async create(input: CreatePaymentInput): Promise<Payment> {
    const row = await prisma.payment.create({
      data: {
        ...input,
        dueDate: parseISO(input.dueDate),
      },
    });
    return this.toPayment(row);
  }

  async createMany(inputs: CreatePaymentInput[]): Promise<Payment[]> {
    const rows = await prisma.$transaction(
      inputs.map((input) =>
        prisma.payment.create({
          data: { ...input, dueDate: parseISO(input.dueDate) },
        })
      )
    );
    return rows.map((row) => this.toPayment(row));
  }

  async update(id: string, input: UpdatePaymentInput): Promise<Payment> {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Payment', id);
    const data = {
      ...input,
      dueDate: input.dueDate ? parseISO(input.dueDate) : undefined,
      paidAt: input.paidAt ? parseISO(input.paidAt) : input.paidAt,
    };

    // Manual tick (no transaction yet, PENDING -> PAID): book the debit on the
    // charge's account and link it, so balances drop.
    if (
      input.status === 'PAID' &&
      existing.status !== 'PAID' &&
      !existing.transactionId
    ) {
      const charge = await prisma.charge.findUnique({
        where: { id: existing.chargeId },
        include: { account: true },
      });
      if (!charge) throw new NotFoundError('Charge', existing.chargeId);
      const debit = planPaymentDebit(
        {
          amount: existing.amount,
          currency: existing.currency as Payment['currency'],
          dueDate: existing.dueDate.toISOString(),
          paidAt: existing.paidAt?.toISOString() ?? null,
        },
        {
          id: charge.account.id,
          currency: charge.account.currency as Payment['currency'],
        },
        input.paidAt
      );
      const row = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            accountId: debit.accountId,
            date: parseISO(debit.date),
            amount: debit.amount,
            transferId: null,
          },
        });
        return tx.payment.update({
          where: { id },
          data: { ...data, transactionId: transaction.id },
        });
      });
      return this.toPayment(row);
    }

    const row = await prisma.payment.update({ where: { id }, data });
    return this.toPayment(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Payment', id);
    await prisma.payment.delete({ where: { id } });
  }

  /**
   * Rapproche une échéance d'une transaction (M2, spec payment-schedule).
   *
   * La liaison est unique dans les deux sens : une transaction ne peut
   * rapprocher qu'une seule échéance (rejet lisible 409, doublon couvert
   * aussi par l'index unique en base). La liaison passe l'échéance au
   * statut PAID avec sa date de paiement — y compris pour une échéance
   * déjà cochée manuellement (rapprochement après coche permis).
   */
  async reconcile(id: string, transactionId: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError('Payment', id);

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new HttpError(422, {
        message: `Unknown transaction: ${transactionId}`,
      });
    }

    const taken = await prisma.payment.findUnique({
      where: { transactionId },
    });
    if (taken && taken.id !== id) {
      throw new HttpError(409, {
        message: `Transaction ${transactionId} is already reconciled to payment ${taken.id}`,
      });
    }

    try {
      const row = await prisma.payment.update({
        where: { id },
        data: {
          transactionId,
          status: 'PAID',
          paidAt: new Date(),
        },
      });
      return this.toPayment(row);
    } catch (error: unknown) {
      // Course concurrente : l'index unique transactionId est le dernier rempart.
      if (isUniqueViolation(error)) {
        throw new HttpError(409, {
          message: `Transaction ${transactionId} is already reconciled`,
        });
      }
      throw error;
    }
  }

  /**
   * Dérapproche une échéance (erreur de rapprochement, ou transaction
   * supprimée) : la liaison disparaît et l'échéance revient au statut
   * PENDING, sans date de paiement. Une échéance sans rapprochement n'a
   * rien à délier (409 lisible).
   */
  async unlink(id: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundError('Payment', id);
    if (!payment.transactionId) {
      throw new HttpError(409, {
        message: `Payment ${id} has no reconciliation to undo`,
      });
    }

    const row = await prisma.payment.update({
      where: { id },
      data: {
        transactionId: null,
        status: 'PENDING',
        paidAt: null,
      },
    });
    return this.toPayment(row);
  }

  private toPayment(row: Prisma.PaymentGetPayload<object>): Payment {
    return {
      ...row,
      currency: row.currency as Payment['currency'],
      status: row.status as Payment['status'],
      dueDate: row.dueDate.toISOString(),
      paidAt: row.paidAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

const globalForPaymentService = globalThis as {
  paymentService?: PaymentService;
};
export const paymentService =
  globalForPaymentService.paymentService ?? new PaymentService();

if (process.env.NODE_ENV !== 'production') {
  globalForPaymentService.paymentService = paymentService;
}
