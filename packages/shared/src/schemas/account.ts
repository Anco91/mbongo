/**
 * Account Schemas
 *
 * Ce fichier contient tous les schémas Zod pour le modèle Account.
 * C'est la SOURCE DE VÉRITÉ UNIQUE pour les types Account.
 *
 * @packageDocumentation
 */

import { z } from 'zod';
import { isValid, parseISO } from 'date-fns';
import { filterSchema } from './filter';

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

/** Devises acceptées pour les comptes (CHF ou EUR uniquement) */
export const accountCurrencySchema = z.enum(['CHF', 'EUR']);

/** Types de comptes possibles */
export const accountTypeSchema = z.enum([
  'CURRENT',     // Compte courant
  'CREDIT_CARD', // Carte de crédit
  'JOINT',       // Compte joint
  'SAVINGS',     // Compte épargne
]);

/** Statuts de compte possibles */
export const accountStatusSchema = z.enum([
  'ACTIVE', // Compte actif
  'CLOSED', // Compte fermé
]);

export type AccountCurrency = z.infer<typeof accountCurrencySchema>;
export type AccountType = z.infer<typeof accountTypeSchema>;
export type AccountStatus = z.infer<typeof accountStatusSchema>;

// ============================================================================
// Schéma Principal
// ============================================================================

/**
 * Schéma principal pour un Account (forme persistée)
 */
export const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  bank: z.string().nullable(),
  currency: accountCurrencySchema,
  accountType: accountTypeSchema,
  memberId: z.string().uuid().nullable(),
  overdraftLimit: z.number().default(0),
  deferredCard: z.boolean().default(false),
  billingDay: z.number().int().min(1).max(31).nullable(),
  openingBalance: z.number().default(0),
  status: accountStatusSchema,
  closedAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

// ============================================================================
// Schémas Dérivés
// ============================================================================

/**
 * Schéma pour créer un nouveau Account
 * Omet les champs générés automatiquement (id, createdAt, updatedAt)
 */
export const createAccountSchema = accountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schéma pour mettre à jour un Account
 * Tous les champs sont optionnels (zod.partial, PAS TS Partial<>)
 */
export const updateAccountSchema = createAccountSchema.partial();

/** Schéma pour les requêtes GET /api/accounts */
export const accountQuerySchema = z.object({
  // Filtres sur les champs
  name: filterSchema.optional(),
  currency: filterSchema.optional(),
  accountType: filterSchema.optional(),
  memberId: filterSchema.optional(),
  status: filterSchema.optional(),

  // Pagination
  limit: z.coerce.number().int().positive().max(500).default(100).optional(),
  cursor: z.string().optional(),

  // Tri
  orderBy: z.enum(['createdAt', 'name']).optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc').optional(),
});

// ============================================================================
// Types TypeScript
// ============================================================================

/** Type TypeScript pour un Account (forme persistée complète) */
export type Account = z.infer<typeof accountSchema>;

/** Type TypeScript pour créer un Account */
export type CreateAccountInput = z.input<typeof createAccountSchema>;

/** Type TypeScript pour mettre à jour un Account */
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

/** Type TypeScript pour les requêtes Account */
export type AccountQuery = z.infer<typeof accountQuerySchema>;
