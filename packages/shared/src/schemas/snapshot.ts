/**
 * Balance Snapshot Schemas
 *
 * Ce fichier contient tous les schémas Zod pour le modèle BalanceSnapshot.
 * C'est la SOURCE DE VÉRITÉ UNIQUE pour les types BalanceSnapshot.
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
// Schéma Principal
// ============================================================================

/**
 * Schéma principal pour un BalanceSnapshot (forme persistée)
 */
export const balanceSnapshotSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  date: isoDate,
  balance: z.number(),
  note: z.string().nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
});

// ============================================================================
// Schémas Dérivés
// ============================================================================

/**
 * Schéma pour créer un nouveau BalanceSnapshot
 * Omet les champs générés automatiquement (id, createdAt, updatedAt)
 */
export const createSnapshotSchema = balanceSnapshotSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/** Schéma pour les requêtes GET /api/snapshots */
export const snapshotQuerySchema = z.object({
  // Filtres sur les champs
  accountId: filterSchema.optional(),
  date: filterSchema.optional(),

  // Pagination
  limit: z.coerce.number().int().positive().max(500).default(100).optional(),
  cursor: z.string().optional(),

  // Tri
  orderBy: z.enum(['createdAt', 'date']).optional(),
  orderDirection: z.enum(['asc', 'desc']).default('desc').optional(),
});

// ============================================================================
// Types TypeScript
// ============================================================================

/** Type TypeScript pour un BalanceSnapshot */
export type BalanceSnapshot = z.infer<typeof balanceSnapshotSchema>;

/** Type TypeScript pour créer un BalanceSnapshot */
export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>;

/** Type TypeScript pour les requêtes BalanceSnapshot */
export type SnapshotQuery = z.infer<typeof snapshotQuerySchema>;

