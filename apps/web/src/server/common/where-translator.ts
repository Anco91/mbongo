/**
 * Where Translator — portable core: query filters → Prisma conditions.
 *
 * The core knows nothing about Mbongo entities: it knows the generic
 * `Filter` shape (packages/shared, zod-validated) and a per-service
 * field map. Each service declares a ~6-line field map derived from its
 * `xxxQuerySchema` — zod stays the validation source, the field map the
 * translation source. Reproducible in any project with the same two
 * shapes (Filter + field map).
 *
 * @module Server/Common/WhereTranslator
 */

import type { Filter, FilterOperator } from '@mbongo/shared';

/**
 * Field map entry: which operators a model field accepts, an optional
 * value transform, and the model field it targets (defaults to the
 * query field — used to fold `dateFrom`/`dateTo` into `date`).
 */
export interface FieldSpec {
  ops: readonly FilterOperator[];
  /** Value transform applied before building the condition. */
  transform?: (value: unknown) => unknown;
  /** Model field receiving the condition (defaults to the query key). */
  target?: string;
}

/** Query field → model field translation table. */
export type FieldMap = Record<string, FieldSpec>;

/**
 * True when the value looks like a `Filter` object (any operator key
 * present) rather than a scalar (e.g. `dateFrom` on transaction queries).
 */
function isFilter(value: unknown): value is Filter {
  return (
    typeof value === 'object' &&
    value !== null &&
    [
      'eq',
      'not',
      'in',
      'notIn',
      'gte',
      'gt',
      'lte',
      'lt',
      'contains',
      'startsWith',
      'endsWith',
      'search',
    ].some((op) => op in (value as Record<string, unknown>))
  );
}

/**
 * Operators accepted as bare scalar values (implicit `eq`), matching the
 * legacy behavior where `?status=PENDING` was normalized upstream.
 */
function scalarCondition(
  value: unknown,
  spec: FieldSpec
): Record<string, unknown> {
  const transformed = spec.transform ? spec.transform(value) : value;
  const op = spec.ops[0] ?? 'eq';
  return condition(op, transformed);
}

/** Generic operator → Prisma condition key. */
const PRISMA_OPS: Record<FilterOperator, string> = {
  eq: 'equals',
  not: 'not',
  in: 'in',
  notIn: 'notIn',
  gte: 'gte',
  gt: 'gt',
  lte: 'lte',
  lt: 'lt',
  contains: 'contains',
  startsWith: 'startsWith',
  endsWith: 'endsWith',
  search: 'search',
};

/** One operator → its Prisma condition fragment. */
function condition(
  op: FilterOperator,
  value: unknown
): Record<string, unknown> {
  const textOps: FilterOperator[] = ['contains', 'startsWith', 'endsWith'];
  const fragment: Record<string, unknown> = { [PRISMA_OPS[op]]: value };
  // Case-insensitive text search, as in the legacy translator.
  if (textOps.includes(op)) fragment.mode = 'insensitive';
  return fragment;
}

/**
 * Translate one validated `Filter` into the Prisma condition fragments
 * for its operators, honoring the field's allowed ops and transform.
 */
function filterCondition(
  filter: Filter,
  spec: FieldSpec
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const op of spec.ops) {
    const raw = (filter as Record<string, unknown>)[op];
    if (raw === undefined) continue;
    const value = spec.transform ? spec.transform(raw) : raw;
    Object.assign(out, condition(op, value));
  }
  return out;
}

/**
 * Create a query → Prisma-where translator for one model.
 *
 * Only mapped fields are translated: pagination and sorting keys
 * (`limit`, `cursor`, `orderBy`…) are naturally ignored, and unknown
 * filter fields can never reach Prisma.
 *
 * @example
 * ```typescript
 * const chargeWhere = createWhereTranslator<Prisma.ChargeWhereInput>({
 *   label: { ops: ['eq', 'contains'] },
 *   type: { ops: ['eq', 'in'] },
 *   amount: { ops: ['gte', 'lte'] },
 * });
 * chargeWhere({ label: { contains: 'Loyer' }, limit: 50 });
 * // { label: { contains: 'Loyer', mode: 'insensitive' } }
 * ```
 */
export function createWhereTranslator<TWhere>(fieldMap: FieldMap) {
  return (query: Record<string, unknown>): TWhere => {
    const where: Record<string, unknown> = {};

    for (const [field, spec] of Object.entries(fieldMap)) {
      const raw = query[field];
      if (raw === undefined) continue;
      // An empty filter object carries no condition at all.
      if (
        typeof raw === 'object' &&
        raw !== null &&
        Object.keys(raw).length === 0
      ) {
        continue;
      }

      const target = spec.target ?? field;
      const fragments = isFilter(raw)
        ? filterCondition(raw, spec)
        : scalarCondition(raw, spec);
      if (Object.keys(fragments).length === 0) continue;

      where[target] = {
        ...(where[target] as object | undefined),
        ...fragments,
      };
    }

    return where as TWhere;
  };
}
