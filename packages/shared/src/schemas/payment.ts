import { z } from 'zod';
import { currencySchema } from './currency';
import { filterSchema } from './filter';

export const paymentStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'CANCELLED',
  'FAILED',
]);

const isoDate = z.string().datetime();

export const paymentSchema = z.object({
  id: z.string().uuid(),
  chargeId: z.string().uuid(),
  amount: z.number().positive(),
  currency: currencySchema,
  dueDate: isoDate,
  status: paymentStatusSchema,
  paidAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

export const createPaymentSchema = paymentSchema
  .omit({ id: true, createdAt: true, updatedAt: true, paidAt: true })
  .extend({ status: paymentStatusSchema.default('PENDING') });
export const createPaymentsSchema = z.array(createPaymentSchema).min(1);
export const createPaymentRequestSchema = z.union([
  createPaymentSchema,
  createPaymentsSchema,
]);

export const updatePaymentSchema = paymentSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

export const paymentQuerySchema = z.object({
  chargeId: filterSchema.optional(),
  status: filterSchema.optional(),
  dueDate: filterSchema.optional(),
  limit: z.coerce.number().int().positive().max(500).default(100).optional(),
  cursor: z.string().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;
export type CreatePaymentInput = z.input<typeof createPaymentSchema>;
export type CreatePaymentsInput = z.input<typeof createPaymentsSchema>;
export type UpdatePaymentInput = z.input<typeof updatePaymentSchema>;
export type PaymentQuery = z.infer<typeof paymentQuerySchema>;
