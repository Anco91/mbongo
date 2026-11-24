/**
 * Unmatched Income Banner
 *
 * Dashboard prompt linking to `/incomes/unmatched` when positive
 * transactions still wait for an income source. Count comes from the
 * shared `useUnmatchedIncome` hook; nothing is recomputed here.
 *
 * @module Components/Dashboard/UnmatchedIncomeBanner
 */

'use client';

import type { JSX } from 'react';
import Link from 'next/link';
import { useUnmatchedIncome } from '@/hooks/use-incomes';
import { buttonVariants } from '@/components/ui/button';

const UNMATCHED_INCOME_HREF = '/incomes/unmatched';

/** « 1 revenu à lier » / « N revenus à lier » (French plural rule). */
function formatUnmatchedLabel(count: number): string {
  return count === 1 ? '1 revenu à lier' : `${count} revenus à lier`;
}

export function UnmatchedIncomeBanner(): JSX.Element | null {
  const { items, isLoading } = useUnmatchedIncome();

  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-900">
        {formatUnmatchedLabel(items.length)}
      </p>
      <Link
        href={UNMATCHED_INCOME_HREF}
        className={buttonVariants({ variant: 'outline', size: 'sm' })}
      >
        Lier
      </Link>
    </div>
  );
}
