/**
 * Accounts route skeleton — member filter then account cards.
 *
 * @module App/Accounts/Loading
 */

import {
  SkeletonCard,
  SkeletonLine,
  SkeletonList,
} from '@/components/ui/skeleton';
import { JSX } from 'react';

export default function AccountsLoading(): JSX.Element {
  return (
    <div className="space-y-3" aria-busy>
      <div className="flex gap-2">
        <SkeletonLine className="h-7 w-24 rounded-full" />
        <SkeletonLine className="h-7 w-20 rounded-full" />
      </div>
      <SkeletonCard lines={0}>
        <SkeletonList rows={4} />
      </SkeletonCard>
    </div>
  );
}
