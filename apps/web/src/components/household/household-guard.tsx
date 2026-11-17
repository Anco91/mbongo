/**
 * Household Guard Component
 *
 * Server container: prefetches the household members via the
 * server-side service (R5), then hands the hydrated cache to the
 * client content.
 *
 * @module Components/Household/HouseholdGuard
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { memberService } from '@/server/members/member.service';
import { JSX } from 'react';

export async function HouseholdGuard({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ['members'],
    queryFn: () => memberService.findMany(),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
