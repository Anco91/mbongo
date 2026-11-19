/**
 * Shared form skeleton — title block then a padded form card. Used by
 * creation and edition routes while the prefetched form resolves.
 *
 * @module App/Forms/LoadingSkeleton
 */

import { SkeletonCard, SkeletonLine } from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function FormLoadingSkeleton(): JSX.Element {
  return (
    <div className="mx-auto max-w-xl space-y-6" aria-busy>
      <div className="space-y-2">
        <SkeletonLine className="h-3 w-20" />
        <SkeletonLine className="h-7 w-56" />
      </div>
      <SkeletonCard lines={7} />
      <SkeletonLine className="h-11 w-full rounded-lg" />
    </div>
  );
}
