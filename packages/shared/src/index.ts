/**
 * @mbongo/shared
 *
 * Shared types, schemas, and domain logic for the mbongo project.
 * This package contains pure domain logic with zero dependencies on infrastructure.
 *
 * Key features:
 * - Zod schemas for validation (single source of truth for types)
 * - Pure domain logic (testable without servers or databases)
 * - Type definitions for all shared entities
 */

// ============================================================================
// Schemas
// ============================================================================

export * from './schemas/charge';
export * from './schemas/filter';

// ============================================================================
// Domain Logic
// ============================================================================

export * from './domain/schedule';

// ============================================================================
// Types
// ============================================================================

// Re-export types from schemas for convenience
export type {
  Charge,
  CreateChargeInput,
  UpdateChargeInput,
  ScheduledPayment,
  CreateScheduledPaymentInput,
  ChargeType,
  Currency,
  Filter,
  ChargeQuery,
} from './schemas/charge';
