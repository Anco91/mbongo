/**
 * Filter Schemas
 * 
 * Schémas génériques pour les filtres et requêtes.
 * Ces schémas sont utilisés pour la validation des query parameters.
 * 
 * @packageDocumentation
 */

import { z } from "zod";

// ============================================================================
// Types de base
// ============================================================================

/** Valeur de filtre générique (string, number, boolean, ou null) */
export const filterValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

/** Opérateurs de filtre */
export const filterOperatorSchema = z.enum([
  "eq",        // Égal à
  "not",       // Différent de
  "in",        // Dans la liste
  "notIn",     // Pas dans la liste
  "gte",       // Supérieur ou égal à
  "gt",        // Supérieur à
  "lte",       // Inférieur ou égal à
  "lt",        // Inférieur à
  "contains",   // Contient
  "startsWith", // Commence par
  "endsWith",   // Finit par
  "search",     // Recherche full-text
]);

// ============================================================================
// Schéma de Filtre Générique
// ============================================================================

/**
 * Schéma pour un filtre sur un champ unique.
 * 
 * @example
 * ```typescript
 * // Filtrer les charges avec amount > 100
 * const filter: Filter = { gte: 100 };
 * 
 * // Filtrer les charges avec category = "rent"
 * const filter: Filter = { eq: "rent" };
 * 
 * // Filtrer les charges avec startDate entre deux dates
 * const filter: Filter = { gte: "2024-01-01", lte: "2024-12-31" };
 * ```
 */
export const filterSchema = z.object({
  eq: filterValue.optional(),
  not: filterValue.optional(),
  in: z.array(filterValue).optional(),
  notIn: z.array(filterValue).optional(),
  gte: filterValue.optional(),
  gt: filterValue.optional(),
  lte: filterValue.optional(),
  lt: filterValue.optional(),
  contains: filterValue.optional(),
  startsWith: filterValue.optional(),
  endsWith: filterValue.optional(),
  search: filterValue.optional(),
});

// ============================================================================
// Schéma de Tri
// ============================================================================

/** Direction de tri */
export const sortDirectionSchema = z.enum(["asc", "desc"]);

/** Schéma pour le tri */
export const sortSchema = z.object({
  field: z.string(),
  direction: sortDirectionSchema.default("desc"),
});

/** Array de tri */
export const sortArraySchema = z.array(sortSchema);

// ============================================================================
// Schéma de Pagination
// ============================================================================

/** Schéma pour la pagination */
export const paginationSchema = z.object({
  limit: z.number().int().positive().max(500).default(100),
  cursor: z.string().optional(),
  skip: z.number().int().nonnegative().default(0),
});

// ============================================================================
// Schéma de Query Générique
// ============================================================================

/**
 * Schéma de base pour toutes les requêtes GET.
 * Combine filtres, pagination et tri.
 * 
 * @example
 * ```typescript
 * // GET /api/charges?limit=50&cursor=abc123
 * const query: GenericQuery = { limit: 50, cursor: "abc123" };
 * 
 * // GET /api/charges?type=eq:FIXED_RECURRING&amount=gte:100
 * const query: GenericQuery = {
 *   filters: {
 *     type: { eq: "FIXED_RECURRING" },
 *     amount: { gte: 100 }
 *   }
 * };
 * ```
 */
export const genericQuerySchema = z.object({
  // Filtres par champ
  filters: z.record(z.string(), filterSchema).optional(),
  
  // Pagination
  limit: z.number().int().positive().max(500).default(100).optional(),
  cursor: z.string().optional(),
  skip: z.number().int().nonnegative().default(0).optional(),
  
  // Tri
  sort: sortArraySchema.optional(),
  
  // Sélection des champs
  select: z.array(z.string()).optional(),
});

// ============================================================================
// Types TypeScript
// ============================================================================

export type Filter = z.infer<typeof filterSchema>;
export type FilterValue = z.infer<typeof filterValue>;
export type FilterOperator = z.infer<typeof filterOperatorSchema>;
export type Sort = z.infer<typeof sortSchema>;
export type SortDirection = z.infer<typeof sortDirectionSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type GenericQuery = z.infer<typeof genericQuerySchema>;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convertir un filtre en objet Prisma where
 * 
 * @example
 * ```typescript
 * const filter: Filter = { gte: 100, lte: 200 };
 * const where = filterToPrisma(filter);
 * // { gte: 100, lte: 200 }
 * ```
 */
export function filterToPrisma(filter: Filter): Record<string, unknown> {
  const condition: Record<string, unknown> = {};
  
  if (filter.eq !== undefined) condition.equals = filter.eq;
  if (filter.not !== undefined) condition.not = { equals: filter.not };
  if (filter.in !== undefined) condition.in = filter.in;
  if (filter.notIn !== undefined) condition.notIn = filter.notIn;
  if (filter.gte !== undefined) condition.gte = filter.gte;
  if (filter.gt !== undefined) condition.gt = filter.gt;
  if (filter.lte !== undefined) condition.lte = filter.lte;
  if (filter.lt !== undefined) condition.lt = filter.lt;
  if (filter.contains !== undefined) condition.contains = filter.contains;
  if (filter.startsWith !== undefined) condition.startsWith = filter.startsWith;
  if (filter.endsWith !== undefined) condition.endsWith = filter.endsWith;
  if (filter.search !== undefined) condition.search = filter.search;
  
  return condition;
}

/**
 * Convertir une query générique en objet Prisma where
 * 
 * @example
 * ```typescript
 * const query: GenericQuery = {
 *   filters: {
 *     amount: { gte: 100, lte: 200 },
 *     type: { eq: "FIXED_RECURRING" }
 *   }
 * };
 * const where = genericQueryToPrisma(query);
 * // { amount: { gte: 100, lte: 200 }, type: { equals: "FIXED_RECURRING" } }
 * ```
 */
export function genericQueryToPrisma<T extends Record<string, unknown>>(
  query: GenericQuery,
  fieldMap?: Record<string, string>
): T {
  const where: Record<string, unknown> = {};
  
  if (query.filters) {
    for (const [field, filter] of Object.entries(query.filters)) {
      const mappedField = fieldMap?.[field] || field;
      where[mappedField] = filterToPrisma(filter);
    }
  }
  
  return where as T;
}

/**
 * Extraire les paramètres de pagination
 */
export function extractPagination(query: GenericQuery): Pagination {
  return {
    limit: query.limit ?? 100,
    cursor: query.cursor,
    skip: query.skip ?? 0,
  };
}

/**
 * Extraire les paramètres de tri
 */
export function extractSort(query: GenericQuery): Sort[] {
  return query.sort ?? [];
}
