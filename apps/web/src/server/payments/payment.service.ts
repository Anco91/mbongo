import { NotFoundError, HttpError } from '@/server/common/http';
import { createWhereTranslator } from '@/server/common/where-translator';
import { prisma } from '@/server/db';
import {
  AUTO_DEBIT_NOTE,
  CreatePaymentInput,
  Payment,
  PaymentQuery,
  paymentDebitAction,
  PaymentDebit,
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
    const existing = await prisma.payment.findUnique({
      where: { id },
      include: { transaction: true },
    });
    if (!existing) throw new NotFoundError('Payment', id);
    const hasAutoDebit = existing.transaction?.note === AUTO_DEBIT_NOTE;
    const action = paymentDebitAction(
      { status: existing.status, hasAutoDebit },
      input
    );
    const { transactionId, ...rest } = input;
    const data = {
      ...rest,
      dueDate: input.dueDate ? parseISO(input.dueDate) : undefined,
      paidAt: input.paidAt ? parseISO(input.paidAt) : input.paidAt,
    };

    if (action === 'create') {
      if (transactionId) {
        throw new HttpError(422, {
          message: 'Use the reconcile endpoint to link a transaction',
        });
      }
      return this.tick(existing, input, data);
    }
    if (action === 'delete') {
      const row = await prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({
          where: { id },
          data: {
            ...data,
            paidAt: input.paidAt ?? null,
            transactionId: null,
          },
        });
        await tx.transaction.delete({
          where: { id: existing.transactionId as string },
        });
        return updated;
      });
      return this.toPayment(row);
    }
    if (action === 'update') {
      return this.syncDebit(existing, input, data);
    }

    const row = await prisma.payment.update({
      where: { id },
      data: { ...data, transactionId },
    });
    return this.toPayment(row);
  }

  /** Account that carries the payment's charge. */
  private async chargeAccount(
    chargeId: string
  ): Promise<{ id: string; currency: Payment['currency'] }> {
    const charge = await prisma.charge.findUnique({
      where: { id: chargeId },
      include: { account: true },
    });
    if (!charge) throw new NotFoundError('Charge', chargeId);
    return {
      id: charge.account.id,
      currency: charge.account.currency as Payment['currency'],
    };
  }

  /** Debit plan for a payment with edits applied; 422 on currency mismatch. */
  private planDebit(
    existing: Prisma.PaymentGetPayload<object>,
    input: UpdatePaymentInput,
    account: { id: string; currency: Payment['currency'] }
  ): PaymentDebit {
    try {
      return planPaymentDebit(
        {
          amount: input.amount ?? existing.amount,
          currency: (input.currency ??
            existing.currency) as Payment['currency'],
          dueDate: existing.dueDate.toISOString(),
          paidAt: existing.paidAt?.toISOString() ?? null,
        },
        account,
        input.paidAt
      );
    } catch (error: unknown) {
      if (error instanceof RangeError) {
        throw new HttpError(422, { message: error.message });
      }
      throw error;
    }
  }

  /** Manual tick: guarded PENDING -> PAID, then the auto debit, atomically. */
  private async tick(
    existing: Prisma.PaymentGetPayload<object>,
    input: UpdatePaymentInput,
    data: Prisma.PaymentUncheckedUpdateManyInput
  ): Promise<Payment> {
    const debit = this.planDebit(
      existing,
      input,
      await this.chargeAccount(existing.chargeId)
    );
    const row = await prisma.$transaction(async (tx) => {
      const guard = await tx.payment.updateMany({
        where: {
          id: existing.id,
          transactionId: null,
          status: { not: 'PAID' },
        },
        data: { ...data, paidAt: data.paidAt ?? parseISO(debit.date) },
      });
      if (guard.count === 0) {
        throw new HttpError(409, {
          message: `Payment ${existing.id} is already paid or reconciled`,
        });
      }
      const transaction = await tx.transaction.create({
        data: {
          accountId: debit.accountId,
          date: parseISO(debit.date),
          amount: debit.amount,
          note: AUTO_DEBIT_NOTE,
          transferId: null,
        },
      });
      return tx.payment.update({
        where: { id: existing.id },
        data: { transactionId: transaction.id },
      });
    });
    return this.toPayment(row);
  }

  /** Edit of a ticked payment: the auto debit follows amount/date. */
  private async syncDebit(
    existing: Prisma.PaymentGetPayload<object>,
    input: UpdatePaymentInput,
    data: Prisma.PaymentUncheckedUpdateInput
  ): Promise<Payment> {
    const debit = this.planDebit(
      { ...existing, paidAt: existing.paidAt },
      input,
      await this.chargeAccount(existing.chargeId)
    );
    const row = await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: existing.transactionId as string },
        data: { date: parseISO(debit.date), amount: debit.amount },
      });
      return tx.payment.update({ where: { id: existing.id }, data });
    });
    return this.toPayment(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await prisma.payment.findUnique({
      where: { id },
      include: { transaction: true },
    });
    if (!existing) throw new NotFoundError('Payment', id);
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });
      if (existing.transaction?.note === AUTO_DEBIT_NOTE) {
        await tx.transaction.delete({ where: { id: existing.transaction.id } });
      }
    });
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
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { transaction: true },
    });
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
      const data = { transactionId, status: 'PAID', paidAt: new Date() };
      const old = payment.transaction;
      if (!old || old.id === transactionId || old.note !== AUTO_DEBIT_NOTE) {
        return this.toPayment(
          await prisma.payment.update({ where: { id }, data })
        );
      }
      // The auto debit is replaced by the real transaction: no double count.
      const row = await prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({ where: { id }, data });
        await tx.transaction.delete({ where: { id: old.id } });
        return updated;
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
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { transaction: true },
    });
    if (!payment) throw new NotFoundError('Payment', id);
    if (!payment.transactionId) {
      throw new HttpError(409, {
        message: `Payment ${id} has no reconciliation to undo`,
      });
    }

    const data = { transactionId: null, status: 'PENDING', paidAt: null };
    const auto = payment.transaction?.note === AUTO_DEBIT_NOTE;
    if (!auto) {
      return this.toPayment(
        await prisma.payment.update({ where: { id }, data })
      );
    }
    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({ where: { id }, data });
      await tx.transaction.delete({
        where: { id: payment.transactionId as string },
      });
      return updated;
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
