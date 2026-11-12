/**
 * Filter to Prisma Where Translator
 *
 * This module provides a single translator for converting validated query filters
 * into Prisma where conditions. It's used by services to translate between
 * the generic filter syntax and Prisma's specific query format.
 *
 * @module Server/Common/FilterToWhere
 */

import { ChargeQuery, Filter, PaymentQuery, AccountQuery, TransactionQuery, TransferQuery, SnapshotQuery } from '@mbongo/shared';
import { Prisma } from '@prisma/client';

/**
 * Convert a generic Filter to a Prisma condition object
 *
 * @param filter - Generic filter object from Zod validation
 * @returns Prisma condition object
 *
 * @example
 * ```typescript
 * const filter: Filter = { eq: 'value', gte: 100 };
 * const condition = filterToCondition(filter);
 * // { equals: 'value', gte: 100 }
 * ```
 */
function filterToCondition(filter: Filter): Record<string, unknown> {
  const condition: Record<string, unknown> = {};

  if (filter.eq !== undefined) {
    condition.equals = filter.eq;
  }

  if (filter.not !== undefined) {
    condition.not = filter.not;
  }

  if (filter.in !== undefined) {
    condition.in = filter.in;
  }

  if (filter.gte !== undefined) {
    condition.gte = filter.gte;
  }

  if (filter.lte !== undefined) {
    condition.lte = filter.lte;
  }

  if (filter.contains !== undefined) {
    condition.contains = filter.contains;
    condition.mode = 'insensitive';
  }

  if (filter.startsWith !== undefined) {
    condition.startsWith = filter.startsWith;
    condition.mode = 'insensitive';
  }

  if (filter.endsWith !== undefined) {
    condition.endsWith = filter.endsWith;
    condition.mode = 'insensitive';
  }

  return condition;
}

/**
 * Convert a query object to a Prisma where clause
 *
 * This function filters out pagination-related keys (limit, cursor, page, offset)
 * and converts each field's filter to a Prisma condition.
 *
 * @param query - Query object from request validation
 * @returns Prisma where input type
 *
 * @example
 * ```typescript
 * const query = {
 *   type: { eq: 'FIXED_RECURRING' },
 *   amount: { gte: 100 },
 *   limit: 50,
 *   cursor: 'abc123',
 * };
 *
 * const where = queryToWhere(query);
 * // { type: { equals: 'FIXED_RECURRING' }, amount: { gte: 100 } }
 * ```
 */
export function queryToWhere<TWhere>(
  query: Record<string, Filter | undefined> & {
    limit?: number;
    cursor?: string;
    page?: number;
    offset?: number;
  }
): TWhere {
  const where: Record<string, unknown> = {};

  for (const [field, filter] of Object.entries(query)) {
    // Skip pagination keys
    if (
      [
        'limit',
        'cursor',
        'page',
        'offset',
        'orderBy',
        'orderDirection',
      ].includes(field)
    ) {
      continue;
    }

    // Only add to where if filter is defined and not empty
    if (filter && Object.keys(filter).length > 0) {
      where[field] = filterToCondition(filter as Filter);
    }
  }

  return where as TWhere;
}

/**
 * Create a query to where function for a specific model
 *
 * This allows for type-safe where clause generation for specific Prisma models.
 *
 * @param model - Prisma model type
 * @returns Type-safe queryToWhere function
 *
 * @example
 * ```typescript
 * const chargeQueryToWhere = createQueryToWhere<Prisma.ChargeWhereInput>();
 * const where = chargeQueryToWhere(query);
 * ```
 */
export function createQueryToWhere<T>() {
  return (query: Record<string, Filter | undefined>) => queryToWhere<T>(query);
}

/**
 * Filter for string fields with additional string-specific operators
 */
export interface StringFilter extends Filter {
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: 'default' | 'insensitive';
}

/**
 * Filter for date fields
 */
export interface DateFilter extends Omit<Filter, 'lt' | 'gt'> {
  lt?: string | Date;
  gt?: string | Date;
}

/**
 * Filter for numeric fields
 */
export interface NumericFilter extends Omit<Filter, 'lt' | 'gt'> {
  lt?: number;
  gt?: number;
}

/**
 * Create a Prisma where input for a charge query
 *
 * @param query - Charge query parameters
 * @returns Prisma ChargeWhereInput
 */
export function chargeQueryToWhere(
  query: ChargeQuery
): Prisma.ChargeWhereInput {
  return queryToWhere<Prisma.ChargeWhereInput>(
    query as unknown as Record<string, Filter | undefined>
  );
}

/**
 * Create a Prisma where input for a payment query
 *
 * @param query - Payment query parameters
 * @returns Prisma PaymentWhereInput
 */
export function paymentQueryToWhere(
  query: PaymentQuery
): Prisma.PaymentWhereInput {
  return queryToWhere<Prisma.PaymentWhereInput>(
    query as unknown as Record<string, Filter | undefined>
  );
}

export function accountQueryToWhere(
  query: AccountQuery
): Prisma.AccountWhereInput {
  return queryToWhere<Prisma.AccountWhereInput>(
    query as unknown as Record<string, Filter | undefined>
  );
}

export function transactionQueryToWhere(
  query: TransactionQuery
): Prisma.TransactionWhereInput {
  return queryToWhere<Prisma.TransactionWhereInput>(
    query as unknown as Record<string, Filter | undefined>
  );
}

export function transferQueryToWhere(
  query: TransferQuery
): Prisma.TransferWhereInput {
  return queryToWhere<Prisma.TransferWhereInput>(
    query as unknown as Record<string, Filter | undefined>
  );
}

export function snapshotQueryToWhere(
  query: SnapshotQuery
): Prisma.BalanceSnapshotWhereInput {
  return queryToWhere<Prisma.BalanceSnapshotWhereInput>(
    query as unknown as Record<string, Filter | undefined>
  );
}
