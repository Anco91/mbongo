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
export * from './schemas/income';
export * from './schemas/monthly-budget';
export * from './contracts/charges.http';
export * from './contracts/payments.http';
export * from './contracts/members.http';
export * from './contracts/accounts.http';
export * from './contracts/transactions.http';
export * from './contracts/transfers.http';
export * from './contracts/snapshots.http';
export * from './contracts/incomes.http';
export * from './contracts/monthly-budgets.http';

// ============================================================================
// Domain Logic & Calculations
// ============================================================================

export * from './domain/schedule';
export * from './domain/balance';
export * from './domain/conversion';
export * from './domain/card-billing';
export * from './domain/payment-status';
export * from './domain/alerts';
export * from './domain/income';
export * from './domain/income-matching';
export * from './domain/income-link';
export * from './domain/transfer-archive';
export * from './domain/charge-category';
export * from './domain/settlement';
export * from './domain/budget';
export * from './lib/calculation/sankey';
export * from './lib/calculation/donut';
export * from './lib/calculation/consolidated';
export * from './lib/calculation/month';
export * from './lib/calculation/active-accounts';
export * from './domain/transfer-accounts';
