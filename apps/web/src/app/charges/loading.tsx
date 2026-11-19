/**
 * Charges route skeleton — filter chips then the charge list.
 *
 * @module App/Charges/Loading
 */

import {
  SkeletonCard,
  SkeletonLine,
  SkeletonList,
} from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function ChargesLoading(): JSX.Element {
  return (
    <div className="space-y-3" aria-busy>
      <div className="flex gap-2">
        <SkeletonLine className="h-7 w-24 rounded-full" />
        <SkeletonLine className="h-7 w-20 rounded-full" />
      </div>
      <SkeletonCard lines={0} className="pt-2">
        <SkeletonList rows={5} />
      </SkeletonCard>
    </div>
  );
}
