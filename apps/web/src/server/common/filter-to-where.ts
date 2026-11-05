/**
 * Filter to Prisma Where Translator
 * 
 * This module provides a single translator for converting validated query filters
 * into Prisma where conditions. It's used by services to translate between
 * the generic filter syntax and Prisma's specific query format.
 * 
 * @module Server/Common/FilterToWhere
 */

import { Filter } from '@mbongo/shared';
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
export function queryToWhere<T>(
  query: Record<string, Filter | undefined> & {
    limit?: number;
    cursor?: string;
    page?: number;
    offset?: number;
  }
): Prisma.PrismaWhereInput<T> {
  const where: Record<string, unknown> = {};

  for (const [field, filter] of Object.entries(query)) {
    // Skip pagination keys
    if (['limit', 'cursor', 'page', 'offset'].includes(field)) {
      continue;
    }

    // Only add to where if filter is defined and not empty
    if (filter && Object.keys(filter).length > 0) {
      where[field] = filterToCondition(filter as Filter);
    }
  }

  return where as Prisma.PrismaWhereInput<T>;
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
  return (query: Record<string, Filter | undefined>) =>
    queryToWhere<T>(query) as Prisma.PrismaWhereInput<T>;
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
export interface DateFilter extends Filter {
  lt?: string | Date;
  gt?: string | Date;
}

/**
 * Filter for numeric fields
 */
export interface NumericFilter extends Filter {
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
  query: Record<string, Filter | undefined> & {
    limit?: number;
    cursor?: string;
  }
): Prisma.ChargeWhereInput {
  return queryToWhere<Prisma.ChargeWhereInput>(query);
}

/**
 * Create a Prisma where input for a scheduled payment query
 * 
 * @param query - Scheduled payment query parameters
 * @returns Prisma ScheduledPaymentWhereInput
 */
export function scheduledPaymentQueryToWhere(
  query: Record<string, Filter | undefined> & {
    limit?: number;
    cursor?: string;
  }
): Prisma.ScheduledPaymentWhereInput {
  return queryToWhere<Prisma.ScheduledPaymentWhereInput>(query);
}
