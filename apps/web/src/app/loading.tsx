/**
 * Root route skeleton — dashboard layout: wealth block, month cursor,
 * both charts at their real height, then the month payments list.
 *
 * @module App/Dashboard/Loading
 */

import {
  SkeletonCard,
  SkeletonLine,
  SkeletonList,
} from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function DashboardLoading(): JSX.Element {
  return (
    <div className="space-y-4" aria-busy>
      <SkeletonCard lines={2} />
      <SkeletonLine className="mx-auto h-8 w-40 rounded-full" />
      <SkeletonCard lines={0} className="h-72">
        <div className="h-56">
          <SkeletonLine className="h-full w-full rounded-lg" />
        </div>
      </SkeletonCard>
      <SkeletonCard lines={0}>
        <div className="h-56">
          <SkeletonLine className="h-full w-full rounded-full" />
        </div>
      </SkeletonCard>
      <SkeletonCard lines={0}>
        <SkeletonList rows={3} />
      </SkeletonCard>
    </div>
  );
}
