/**
 * Household route skeleton — member rows then the create action.
 *
 * @module App/Household/Loading
 */

import {
  SkeletonCard,
  SkeletonLine,
  SkeletonList,
} from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function HouseholdLoading(): JSX.Element {
  return (
    <div className="space-y-3" aria-busy>
      <SkeletonCard lines={0}>
        <SkeletonList rows={3} />
      </SkeletonCard>
      <SkeletonLine className="h-11 w-full rounded-lg" />
    </div>
  );
}
