/**
 * Charge Schemas
 *
 * Ce fichier contient tous les schémas Zod pour le modèle Charge.
 * C'est la SOURCE DE VÉRITÉ UNIQUE pour les types Charge.
 *
 * @packageDocumentation
 */

import { z } from 'zod';
import { isValid, parseISO } from 'date-fns';
import { filterSchema } from './filter';
import { currencySchema } from './currency';

// ============================================================================
// Types de base
// ============================================================================

/** Date ISO 8601 validation */
const isoDate = z
  .string()
  .refine((value) => isValid(parseISO(value)), 'Invalid ISO 8601 date');

// ============================================================================
// Types Enum
// ============================================================================

/** Types de charges possibles */
export const chargeTypeSchema = z.enum([
  'FIXED_RECURRING', // rent, insurance - recurring, monthly or not
  'INSTALLMENT', // N known payments (e.g. tax spread over 4 months)
  'TEMPORARY', // known end date (e.g. 12-month subscription)
  'ONE_OFF', // one-time payment
  'UPCOMING', // mandatory upcoming (SERAFE), provisioned monthly
]);

/** Fréquence de répétition */
export const frequencySchema = z.enum(['monthly', 'weekly', 'yearly', 'daily']);

export type ChargeType = z.infer<typeof chargeTypeSchema>;

// ============================================================================
// Schéma Principal
// ============================================================================

/**
 * Schéma principal pour une Charge (forme persitée)
 */
export const chargeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1, 'Label is required'),
  type: chargeTypeSchema,
  amount: z.number().positive('Amount must be positive'),
  currency: currencySchema,
  accountId: z.string().uuid(),
  category: z.string().min(1, 'Category is required'),
  startDate: isoDate,
  endDate: isoDate.nullable(),
  frequency: frequencySchema.nullable(),
  installments: z.number().int().positive().nullable(),
  provisioned: z.boolean().default(false),
  createdAt: isoDate,
  updatedAt: isoDate,
});

// ============================================================================
// Schémas Dérivés
// ============================================================================

/**
 * Schéma pour créer une nouvelle Charge
 * Omet les champs générés automatiquement (id, createdAt, updatedAt)
 */
export const createChargeSchema = chargeSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .superRefine((charge, context) => {
    if (
      (charge.type === 'FIXED_RECURRING' || charge.type === 'TEMPORARY') &&
      !charge.frequency
    ) {
      context.addIssue({
        code: 'custom',
        path: ['frequency'],
        message: 'Frequency is required for recurring charges',
      });
    }
    if (charge.type === 'TEMPORARY' && !charge.endDate) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date is required for temporary charges',
      });
    }
    if (charge.type === 'INSTALLMENT' && !charge.installments) {
      context.addIssue({
        code: 'custom',
        path: ['installments'],
        message: 'Installment count is required',
      });
    }
  });

/**
 * Schéma pour mettre à jour une Charge
 * Tous les champs sont optionnels (zod.partial, PAS TS Partial<>)
 */
export const updateChargeSchema = chargeSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial();

/** Schéma pour les requêtes GET /api/charges */
export const chargeQuerySchema = z.object({
  // Filtres sur les champs
  label: filterSchema.optional(),
  type: filterSchema.optional(),
  category: filterSchema.optional(),
  accountId: filterSchema.optional(),
  currency: filterSchema.optional(),
  startDate: filterSchema.optional(),
  endDate: filterSchema.optional(),

  // Pagination
  limit: z.coerce.number().int().positive().max(500).default(100).optional(),
  cursor: z.string().optional(),

  // Tri
  orderBy: z.enum(['createdAt', 'startDate', 'amount']).optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc').optional(),
});

// ============================================================================
// Types TypeScript
// ============================================================================

/** Type TypeScript pour une Charge */
export type Charge = z.infer<typeof chargeSchema>;

/** Type TypeScript pour créer une Charge */
export type CreateChargeInput = z.input<typeof createChargeSchema>;

/** Type TypeScript pour mettre à jour une Charge */
export type UpdateChargeInput = z.infer<typeof updateChargeSchema>;

/** Type TypeScript pour les requêtes Charge */
export type ChargeQuery = z.infer<typeof chargeQuerySchema>;

// ============================================================================
// Schéma pour les requêtes de calcul
// ============================================================================

/** Schéma pour les requêtes de calcul de provision */
export const provisionQuerySchema = z.object({
  year: z.number().int().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  category: z.string().optional(),
});

export type ProvisionQuery = z.infer<typeof provisionQuerySchema>;

// ============================================================================
// Exports
// ============================================================================

export { isoDate };
