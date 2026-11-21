/**
 * Monthly Budget Schema
 *
 * État de préparation d'un mois calendaire. La clé `AAAA-MM` est la
 * source de vérité : une ligne existe seulement après « Terminer ».
 *
 * @packageDocumentation
 */

import { z } from 'zod';
import { isoDate } from './charge';

/** Clé mensuelle stable `AAAA-MM`. */
export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected a YYYY-MM month key');

/** État mensuel persisté. */
export const monthlyBudgetSchema = z.object({
  month: monthKeySchema,
  preparedAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

/** Corps de `PUT /api/monthly-budgets/{month}` (idempotent). */
export const prepareMonthlyBudgetSchema = z.object({
  preparedAt: isoDate.optional(),
});

export type MonthKey = z.infer<typeof monthKeySchema>;
export type MonthlyBudget = z.infer<typeof monthlyBudgetSchema>;
export type PrepareMonthlyBudgetInput = z.infer<
  typeof prepareMonthlyBudgetSchema
>;
