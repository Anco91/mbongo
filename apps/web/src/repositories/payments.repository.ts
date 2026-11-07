import {
  createPaymentSchema,
  createPaymentsSchema,
  paymentQuerySchema,
  paymentSchema,
  updatePaymentSchema,
  type CreatePaymentInput,
  type CreatePaymentsInput,
  type Payment,
  type PaymentHttp,
  type PaymentQuery,
  type UpdatePaymentInput,
} from '@mbongo/shared';
import { request } from '@/lib/api';
import { z } from 'zod';

export const paymentsRepository: PaymentHttp = {
  async findMany(query: PaymentQuery = {}): Promise<Payment[]> {
    const payments = await request<Payment[]>('GET', '/payments', {
      params: paymentQuerySchema.parse(query),
    });
    return z.array(paymentSchema).parse(payments);
  },

  async findOne(id: string): Promise<Payment> {
    return paymentSchema.parse(await request('GET', `/payments/${id}`));
  },

  async create(input: CreatePaymentInput): Promise<Payment> {
    const body = createPaymentSchema.parse(input);
    return paymentSchema.parse(await request('POST', '/payments', { body }));
  },

  async createMany(inputs: CreatePaymentsInput): Promise<Payment[]> {
    const body = createPaymentsSchema.parse(inputs);
    const payments = await request<Payment[]>('POST', '/payments', { body });
    return z.array(paymentSchema).parse(payments);
  },

  async update(id: string, input: UpdatePaymentInput): Promise<Payment> {
    const body = updatePaymentSchema.parse(input);
    return paymentSchema.parse(
      await request('PATCH', `/payments/${id}`, { body })
    );
  },

  async remove(id: string): Promise<void> {
    await request<void>('DELETE', `/payments/${id}`);
  },
};
