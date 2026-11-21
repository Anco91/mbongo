/**
 * Account Creation Page
 *
 * Dedicated creation page (one page, one responsibility — mock_POC).
 * The guard hydrates the household members used by the owner selector.
 *
 * @module App/Dashboard/Accounts/New
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { memberService } from '@/server/members/member.service';
import { AccountCreateForm } from '@/components/accounts/account-create-form';
import { JSX } from 'react';

export default async function NewAccountPage(): Promise<JSX.Element> {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ['members'],
    queryFn: () => memberService.findMany(),
  });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <HydrationBoundary state={dehydrate(qc)}>
        <AccountCreateForm />
      </HydrationBoundary>
    </div>
  );
}
