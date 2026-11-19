/**
 * Schedule route skeleton — the upcoming due-date list.
 *
 * @module App/Schedule/Loading
 */

import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function ScheduleLoading(): JSX.Element {
  return (
    <div className="space-y-3" aria-busy>
      <SkeletonCard lines={0}>
        <SkeletonList rows={5} />
      </SkeletonCard>
    </div>
  );
}
