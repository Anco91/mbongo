/**
 * Household Guard Component
 *
 * Server container: prefetches the household members via the
 * server-side service (R5), then hands the hydrated cache to the
 * client content.
 *
 * @module Components/Household/HouseholdGuard
 */

import { memberService } from '@/server/members/member.service';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
import { JSX } from 'react';

export function HouseholdGuard({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const entries: PrefetchEntry[] = [
    {
      queryKey: ['members'],
      queryFn: () => memberService.findMany(),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
