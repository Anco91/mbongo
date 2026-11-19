/**
 * Skeleton primitives — neutral placeholders used by route `loading.tsx`
 * files and by views that wait for hydration. Heights follow the real
 * views so the swap never shifts the layout.
 *
 * @module Components/UI/Skeleton
 */

import { JSX, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** One placeholder line. */
export function SkeletonLine({
  className,
}: {
  className?: string;
}): JSX.Element {
  return (
    <div
      className={cn('h-3 animate-pulse rounded bg-slate-100', className)}
      aria-hidden
    />
  );
}

/** A card-shaped placeholder: title line plus content lines. */
export function SkeletonCard({
  lines = 3,
  className,
  children,
}: {
  lines?: number;
  className?: string;
  /** Optional content replacing the placeholder lines. */
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className={cn('rounded-xl border border-slate-100 p-4', className)}>
      <SkeletonLine className="mb-3 h-3 w-1/3" />
      {children ?? (
        <div className="space-y-2">
          {Array.from({ length: lines }, (_, index) => (
            <SkeletonLine
              key={index}
              className={index === lines - 1 ? 'w-2/3' : 'w-full'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** A list placeholder: one row per expected item. */
export function SkeletonList({ rows = 3 }: { rows?: number }): JSX.Element {
  return (
    <div className="divide-y divide-slate-100" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between py-3">
          <div className="w-2/3 space-y-2">
            <SkeletonLine className="w-1/2" />
            <SkeletonLine className="h-2.5 w-1/3" />
          </div>
          <SkeletonLine className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}
