/**
 * Due-date detail skeleton — summary rows then the reconciliation block.
 *
 * @module App/Schedule/DetailLoading
 */

import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function PaymentDetailLoading(): JSX.Element {
  return (
    <div className="space-y-3" aria-busy>
      <SkeletonCard lines={4} />
      <SkeletonCard lines={0}>
        <SkeletonList rows={2} />
      </SkeletonCard>
    </div>
  );
}
