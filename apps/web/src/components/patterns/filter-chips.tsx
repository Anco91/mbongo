/**
 * Filter Chips — horizontal pill selector used by list filters.
 *
 * @module Components/Patterns/FilterChips
 */

'use client';

import { JSX } from 'react';

export interface FilterChipItem {
  value: string;
  label: string;
}

interface FilterChipsProps {
  items: readonly FilterChipItem[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterChips({
  items,
  value,
  onChange,
}: FilterChipsProps): JSX.Element {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === item.value
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
