/**
 * Member Schemas
 *
 * Ce fichier contient tous les schémas Zod pour le modèle Member.
 * C'est la SOURCE DE VÉRITÉ UNIQUE pour les types Member.
 *
 * @packageDocumentation
 */

import { z } from 'zod';
import { isoDate } from './charge';

// ============================================================================
// Types Enum
// ============================================================================

/** Rôle d'un membre du foyer */
export const memberRoleSchema = z.enum(['PRIMARY', 'PARTNER']);

export type MemberRole = z.infer<typeof memberRoleSchema>;

// ============================================================================
// Schéma Principal
// ============================================================================

/**
 * Schéma principal pour un Member (forme persistée)
 */
export const memberSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().min(1, 'First name is required'),
  role: memberRoleSchema,
  createdAt: isoDate,
  updatedAt: isoDate,
});

// ============================================================================
// Schémas Dérivés
// ============================================================================

/**
 * Schéma pour créer un nouveau Member
 * Omet les champs générés automatiquement (id, createdAt, updatedAt)
 */
export const createMemberSchema = memberSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// Types TypeScript
// ============================================================================

/** Type TypeScript pour un Member */
export type Member = z.infer<typeof memberSchema>;

/** Type TypeScript pour créer un Member */
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
