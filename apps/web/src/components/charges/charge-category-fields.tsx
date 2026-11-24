/**
 * Charge category fields — category select plus its dependent sub-category
 * select, shared by the create and edit forms. Must render inside a `Form`.
 *
 * @module Components/Charges/ChargeCategoryFields
 */

'use client';

import { JSX } from 'react';
import { useWatch } from 'react-hook-form';
import { CHARGE_CATEGORIES, listSubcategories } from '@mbongo/shared';
import { SelectInput } from '@/components/form';

const CATEGORY_OPTIONS = Object.keys(CHARGE_CATEGORIES).map((c) => ({
  value: c,
  label: c,
}));

export function ChargeCategoryFields(): JSX.Element {
  const category = useWatch({ name: 'category' }) as string | undefined;
  const subcategories = listSubcategories(category ?? '').map((s) => ({
    value: s,
    label: s,
  }));

  return (
    <>
      <SelectInput
        name="category"
        label="Catégorie"
        options={CATEGORY_OPTIONS}
      />
      {subcategories.length > 0 && (
        <SelectInput
          name="subcategory"
          label="Sous-catégorie"
          options={subcategories}
          placeholder="Aucune"
        />
      )}
    </>
  );
}
