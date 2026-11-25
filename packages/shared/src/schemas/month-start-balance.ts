/**
 * Month Start Balance Schema
 *
 * Solde logique de départ d'un compte pour un mois (confirmé par
 * l'utilisateur). Une ligne par (mois, compte).
 *
 * @packageDocumentation
 */

import { z } from 'zod';
import { isoDate } from './charge';
import { monthKeySchema } from './monthly-budget';

/** Tolérance du bruit flottant sous le centime. */
const CENT_EPSILON = 1e-6;

const finiteBalance = z.number().finite();

/** Ligne persistée. */
export const monthStartBalanceSchema = z.object({
  month: monthKeySchema,
  accountId: z.string().min(1),
  balance: finiteBalance,
  createdAt: isoDate,
  updatedAt: isoDate,
});

/** Corps de `PUT /api/month-start-balances/{month}` (idempotent). */
export const saveMonthStartBalancesSchema = z.object({
  balances: z
    .array(
      z.object({
        accountId: z.string().min(1),
        balance: finiteBalance.refine(
          (x) => Math.abs(x * 100 - Math.round(x * 100)) < CENT_EPSILON,
          'At most 2 decimals'
        ),
      })
    )
    .min(1)
    .refine(
      (list) => new Set(list.map((b) => b.accountId)).size === list.length,
      'Each account may appear only once'
    ),
});

export type MonthStartBalance = z.infer<typeof monthStartBalanceSchema>;
export type SaveMonthStartBalancesInput = z.infer<
  typeof saveMonthStartBalancesSchema
>;
