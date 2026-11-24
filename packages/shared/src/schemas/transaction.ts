/**
 * Transaction Schemas
 *
 * Ce fichier contient tous les schémas Zod pour le modèle Transaction.
 * C'est la SOURCE DE VÉRITÉ UNIQUE pour les types Transaction.
 *
 * @packageDocumentation
 */

import { z } from 'zod';
import { isValid, parseISO } from 'date-fns';
import { filterSchema } from './filter';
import { AUTO_DEBIT_NOTE } from '../domain/payment-debit';

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

/** Rôle d'une transaction dans un transfert */
export const transferRoleSchema = z.enum(['SOURCE', 'TARGET']);

export type TransferRole = z.infer<typeof transferRoleSchema>;

// ============================================================================
// Schéma Principal
// ============================================================================

/**
 * Schéma principal pour une Transaction (forme persistée)
 */
export const transactionSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  date: isoDate,
  amount: z.number().refine((v) => v !== 0, 'Amount must be non-zero'),
  category: z.string().nullable(),
  note: z.string().nullable().default(null),
  transferId: z.string().min(1).nullable(),
  transferRole: transferRoleSchema.nullable(),
  /** Source de revenu rattachée (confirmation mensuelle uniquement). */
  incomeId: z.string().min(1).nullable().optional(),
  /** Mois confirmé `AAAA-MM` (confirmation mensuelle uniquement). */
  budgetMonth: z.string().min(1).nullable().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

// ============================================================================
// Schémas Dérivés
// ============================================================================

/**
 * Schéma pour créer une nouvelle Transaction.
 * Omet les champs générés automatiquement (id, createdAt, updatedAt).
 * `transferId` et `transferRole` sont conservés : ils sont renseignés
 * par TransferService lors de la création d'une transaction liée.
 */
export const createTransactionSchema = transactionSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    // Renseignés uniquement par la confirmation d'un revenu.
    incomeId: true,
    budgetMonth: true,
  })
  .extend({
    // Une transaction saisie manuellement n'est pas liée à un transfert :
    // ces champs ne sont renseignés que par TransferService.
    transferId: z.string().min(1).nullable().default(null),
    transferRole: transferRoleSchema.nullable().default(null),
    // La note réservée au débit automatique d'un paiement ne peut pas être
    // saisie par un utilisateur.
    note: transactionSchema.shape.note.refine(
      (value) => value?.trim() !== AUTO_DEBIT_NOTE,
      'Reserved note'
    ),
  });

/**
 * Schéma pour mettre à jour une Transaction.
 * Tous les champs sont optionnels (z.partial, PAS TS Partial<>).
 */
export const updateTransactionSchema = createTransactionSchema.partial();

/**
 * Stand-in for a real null in a filter value: HTTP query strings cannot
 * carry null, so the server turns it back into null (transferId, incomeId).
 */
export const NULL_FILTER_VALUE = 'null';

/** Schéma pour les requêtes GET /api/transactions */
export const transactionQuerySchema = z.object({
  // Filtres sur les champs
  accountId: filterSchema.optional(),
  category: filterSchema.optional(),
  transferId: filterSchema.optional(),
  transferRole: filterSchema.optional(),
  amount: filterSchema.optional(),
  incomeId: filterSchema.optional(),

  // Plage de dates
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),

  // Pagination
  limit: z.coerce.number().int().positive().max(500).default(100).optional(),
  cursor: z.string().optional(),

  // Tri
  orderBy: z.enum(['date', 'amount', 'createdAt']).optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc').optional(),
});

// ============================================================================
// Types TypeScript
// ============================================================================

/** Type TypeScript pour une Transaction */
export type Transaction = z.infer<typeof transactionSchema>;

/** Type TypeScript pour créer une Transaction */
export type CreateTransactionInput = z.input<typeof createTransactionSchema>;

/** Type TypeScript pour mettre à jour une Transaction */
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

/** Type TypeScript pour les requêtes Transaction */
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
