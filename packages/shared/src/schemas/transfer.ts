/**
 * Transfer Schemas
 *
 * Ce fichier contient tous les schémas Zod pour le modèle Transfer.
 * C'est la SOURCE DE VÉRITÉ UNIQUE pour les types Transfer.
 *
 * Les transferts suivent un workflow en 2 phases :
 * - Phase 1 (ESTIMATED) : le montant envoyé et le taux estimé sont connus
 * - Phase 2 (COMPLETED) : le montant reçu et le taux effectif sont confirmés
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

/** Statuts possibles pour un transfert */
export const transferStatusSchema = z.enum(['ESTIMATED', 'COMPLETED']);

export type TransferStatus = z.infer<typeof transferStatusSchema>;

// ============================================================================
// Schéma Principal
// ============================================================================

/**
 * Schéma principal pour un Transfer (forme persistée)
 */
export const transferSchema = z.object({
  id: z.string().uuid(),
  sourceAccountId: z.string().uuid(),
  targetAccountId: z.string().uuid(),
  amountSent: z.number().positive('Amount sent must be positive'),
  rateEstimated: z.number().positive('Estimated rate must be positive'),
  rateDate: isoDate,
  amountReceived: z.number().positive('Amount received must be positive').nullable(),
  rateEffective: z.number().positive('Effective rate must be positive').nullable(),
  fees: z.number().nullable(),
  memo: z.string().nullable(),
  status: transferStatusSchema,
  sentAt: isoDate,
  receivedAt: isoDate.nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

// ============================================================================
// Schémas Dérivés
// ============================================================================

/**
 * Schéma pour créer un nouveau Transfer (phase 1 — ESTIMATED)
 * Omet les champs de phase 2 et les champs générés automatiquement.
 * Valide que sourceAccountId !== targetAccountId.
 */
export const createTransferSchema = transferSchema
  .omit({
    id: true,
    amountReceived: true,
    rateEffective: true,
    fees: true,
    status: true,
    receivedAt: true,
    createdAt: true,
    updatedAt: true,
  })
  .superRefine((transfer, context) => {
    if (transfer.sourceAccountId === transfer.targetAccountId) {
      context.addIssue({
        code: 'custom',
        path: ['targetAccountId'],
        message: 'Target account must be different from source account',
      });
    }
  });

/**
 * Schéma pour compléter un Transfer (phase 2 — COMPLETED)
 * Contient uniquement les champs confirmés à réception.
 */
export const updateTransferSchema = z.object({
  amountReceived: z.number().positive('Amount received must be positive'),
  receivedAt: isoDate,
});

/** Schéma pour les requêtes GET /api/transfers */
export const transferQuerySchema = z.object({
  // Filtres sur les champs
  status: filterSchema.optional(),
  sourceAccountId: filterSchema.optional(),
  targetAccountId: filterSchema.optional(),

  // Pagination
  limit: z.coerce.number().int().positive().max(500).default(100).optional(),
  cursor: z.string().optional(),

  // Tri
  orderBy: z.enum(['createdAt', 'sentAt', 'amountSent']).optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc').optional(),
});

// ============================================================================
// Types TypeScript
// ============================================================================

/** Type TypeScript pour un Transfer */
export type Transfer = z.infer<typeof transferSchema>;

/** Type TypeScript pour créer un Transfer (phase 1) */
export type CreateTransferInput = z.input<typeof createTransferSchema>;

/** Type TypeScript pour compléter un Transfer (phase 2) */
export type UpdateTransferInput = z.infer<typeof updateTransferSchema>;

/** Type TypeScript pour les requêtes Transfer */
export type TransferQuery = z.infer<typeof transferQuerySchema>;

