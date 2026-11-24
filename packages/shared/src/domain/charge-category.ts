/**
 * Charge categories and sub-categories.
 *
 * STUB (spec charge-subcategories): the Executor replaces the bodies and
 * fills `CHARGE_CATEGORIES` as listed in the Frame. Locked tests import
 * these exact names.
 *
 * @packageDocumentation
 */

/** Known categories and their sub-categories (display order). */
export const CHARGE_CATEGORIES: Readonly<Record<string, readonly string[]>> =
  {};

/** Sub-categories of a category; empty for an unknown or free category. */
export function listSubcategories(_category: string): readonly string[] {
  throw new Error('not implemented');
}

/**
 * First refusal reason, or null when the pair is valid. A null
 * sub-category is always valid; a set one must belong to its category.
 */
export function checkChargeSubcategory(
  _category: string,
  _subcategory: string | null
): string | null {
  throw new Error('not implemented');
}

/**
 * Sub-category stored after a patch: an explicit patch value wins; a
 * category change without one resets it to null; otherwise it is kept.
 */
export function resolveChargeSubcategory(
  _existing: { category: string; subcategory: string | null },
  _patch: { category?: string; subcategory?: string | null }
): string | null {
  throw new Error('not implemented');
}
