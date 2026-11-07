import { NotFoundError } from '@/server/common/http';
import { paymentQueryToWhere } from '@/server/common/filter-to-where';
import { prisma } from '@/server/db';
import {
  CreatePaymentInput,
  Payment,
  PaymentQuery,
  UpdatePaymentInput,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';

export class PaymentService {
  async findMany(query: PaymentQuery): Promise<Payment[]> {
    const rows = await prisma.payment.findMany({
      where: paymentQueryToWhere(query),
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
    const row = await prisma.payment.update({
      where: { id },
      data: {
        ...input,
        dueDate: input.dueDate ? parseISO(input.dueDate) : undefined,
        paidAt: input.paidAt ? parseISO(input.paidAt) : input.paidAt,
      },
    });
    return this.toPayment(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Payment', id);
    await prisma.payment.delete({ where: { id } });
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
