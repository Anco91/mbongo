/**
 * Merchant Category Row
 *
 * One merchant of the month: count, total and the category it maps to
 * (persisted per device through the merchant mapping store).
 *
 * @module Components/Import/MerchantCategoryRow
 */

'use client';

import { type JSX } from 'react';
import { CHARGE_CATEGORIES, UNCATEGORIZED } from '@mbongo/shared';
import { setCategory } from '@/lib/merchant-mapping-store';
import { formatAmount } from '@/lib/format';

const CATEGORY_NAMES = Object.keys(CHARGE_CATEGORIES);

interface MerchantCategoryRowProps {
  merchant: string;
  category: string;
  total: number;
  count: number;
}

export function MerchantCategoryRow({
  merchant,
  category,
  total,
  count,
}: MerchantCategoryRowProps): JSX.Element {
  return (
    <li className="flex items-center gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">
          {merchant}
        </p>
        <p className="text-xs text-slate-500">
          {count} × · {formatAmount(total, 'EUR')}
        </p>
      </div>
      <select
        aria-label={`Catégorie de ${merchant}`}
        value={category}
        onChange={(event) => setCategory(merchant, event.target.value)}
        className="w-40 appearance-none rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-slate-400 focus:outline-none"
      >
        <option value={UNCATEGORIZED}>{UNCATEGORIZED}</option>
        {CATEGORY_NAMES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </li>
  );
}
