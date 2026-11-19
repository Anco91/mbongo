/**
 * Alerts route skeleton — the alert list.
 *
 * @module App/Alerts/Loading
 */

import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function AlertsLoading(): JSX.Element {
  return (
    <div className="space-y-3" aria-busy>
      <SkeletonCard lines={0}>
        <SkeletonList rows={4} />
      </SkeletonCard>
    </div>
  );
}
