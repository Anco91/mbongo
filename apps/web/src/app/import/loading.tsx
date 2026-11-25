/**
 * Import route skeleton.
 *
 * @module App/Import/Loading
 */

import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function ImportLoading(): JSX.Element {
  return (
    <div className="space-y-3" aria-busy>
      <SkeletonCard lines={0}>
        <SkeletonList rows={4} />
      </SkeletonCard>
    </div>
  );
}
