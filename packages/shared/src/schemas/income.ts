/**
 * Income Schemas
 *
 * Source de vérité unique des revenus : une source récurrente déclarée
 * une fois, confirmée chaque mois par une transaction positive rattachée.
 *
 * @packageDocumentation
 */

import { z } from 'zod';
import { isValid, parseISO } from 'date-fns';
import { accountCurrencySchema } from './account';
import { monthKeySchema } from './monthly-budget';

const isoDate = z
  .string()
  .refine((value) => isValid(parseISO(value)), 'Invalid ISO 8601 date');

/** Fréquences supportées pour une source de revenu. */
export const incomeFrequencySchema = z.enum(['monthly', 'yearly']);

/** Forme persistée d'une source de revenu. */
export const incomeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, 'Label is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: accountCurrencySchema,
  accountId: z.string().min(1),
  memberId: z.string().min(1).nullable().default(null),
  frequency: incomeFrequencySchema,
  startDate: isoDate,
  endDate: isoDate.nullable().default(null),
  active: z.boolean().default(true),
  createdAt: isoDate,
  updatedAt: isoDate,
});

const incomeFields = incomeSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

function validateIncomeDates(
  value: { startDate?: string; endDate?: string | null },
  ctx: z.RefinementCtx
): void {
  if (!value.startDate || !value.endDate) return;
  if (parseISO(value.endDate) < parseISO(value.startDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'End date must not precede start date',
    });
  }
}

/** Création d'une source de revenu. */
export const createIncomeSchema = incomeFields.superRefine(validateIncomeDates);

/** Mise à jour partielle d'une source de revenu. */
export const updateIncomeSchema = incomeFields
  .partial()
  .superRefine(validateIncomeDates);

/** Confirmation du revenu d'un mois : montant réel et date du mois. */
export const confirmIncomeSchema = z.object({
  month: monthKeySchema,
  amount: z.number().positive('Amount must be positive'),
  date: isoDate.optional(),
});

/** Filtres de `GET /api/incomes`. */
export const incomeQuerySchema = z.object({
  month: monthKeySchema.optional(),
  active: z.enum(['true', 'false']).optional(),
  accountId: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(500).default(100).optional(),
});

export type Income = z.infer<typeof incomeSchema>;
export type IncomeFrequency = z.infer<typeof incomeFrequencySchema>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type ConfirmIncomeInput = z.infer<typeof confirmIncomeSchema>;
export type IncomeQuery = z.infer<typeof incomeQuerySchema>;
