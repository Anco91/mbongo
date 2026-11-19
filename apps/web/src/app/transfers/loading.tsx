/**
 * Transfers route skeleton — one card per transfer row.
 *
 * @module App/Transfers/Loading
 */

import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function TransfersLoading(): JSX.Element {
  return (
    <div className="space-y-3" aria-busy>
      <SkeletonCard lines={0}>
        <SkeletonList rows={4} />
      </SkeletonCard>
    </div>
  );
}
