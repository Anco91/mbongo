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
export * from './schemas/payment';
export * from './schemas/currency';
export * from './schemas/filter';
export * from './schemas/member';
export * from './schemas/account';
export * from './schemas/transaction';
export * from './schemas/transfer';
export * from './schemas/snapshot';
export * from './contracts/charges.http';
export * from './contracts/payments.http';
export * from './contracts/members.http';
export * from './contracts/accounts.http';
export * from './contracts/transactions.http';
export * from './contracts/transfers.http';
export * from './contracts/snapshots.http';

// ============================================================================
// Domain Logic
// ============================================================================

export * from './domain/schedule';
export * from './domain/balance';
export * from './domain/conversion';
