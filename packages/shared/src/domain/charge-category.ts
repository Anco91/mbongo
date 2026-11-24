/**
 * Charge categories and sub-categories.
 *
 * Single closed taxonomy shared by forms, schema and server. `category`
 * itself stays free text (legacy rows); a category outside this list simply
 * has no sub-category.
 *
 * @packageDocumentation
 */

/** Known categories and their sub-categories (display order). */
export const CHARGE_CATEGORIES: Readonly<Record<string, readonly string[]>> = {
  Logement: ['Loyer', 'Charges', 'Énergie', 'Eau'],
  Santé: ['LAMal', 'Complémentaire', 'Soins'],
  'Impôts & taxes': ['Impôts', 'Redevances'],
  Assurances: [
    'Auto',
    'Habitation',
    'Responsabilité civile',
    'Garantie',
    'Vie',
  ],
  Abonnements: ['Mobile', 'Internet', 'Sport'],
  Médias: ['Streaming', 'Presse'],
  Divers: [],
};

/** Sub-categories of a category; empty for an unknown or free category. */
export function listSubcategories(category: string): readonly string[] {
  return Object.prototype.hasOwnProperty.call(CHARGE_CATEGORIES, category)
    ? CHARGE_CATEGORIES[category]
    : [];
}

/**
 * First refusal reason, or null when the pair is valid. A null
 * sub-category is always valid; a set one must belong to its category.
 */
export function checkChargeSubcategory(
  category: string,
  subcategory: string | null
): string | null {
  if (subcategory === null) return null;
  if (listSubcategories(category).includes(subcategory)) return null;
  return `Sub-category "${subcategory}" does not belong to category "${category}"`;
}

/**
 * Sub-category stored after a patch: an explicit patch value wins; a
 * category change without one resets it to null; otherwise it is kept.
 */
export function resolveChargeSubcategory(
  existing: { category: string; subcategory: string | null },
  patch: { category?: string; subcategory?: string | null }
): string | null {
  if (patch.subcategory !== undefined) return patch.subcategory;
  if (patch.category !== undefined && patch.category !== existing.category) {
    return null;
  }
  return existing.subcategory;
}
