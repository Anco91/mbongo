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
      <div>
        <p className="text-[11px] uppercase tracking-wider text-gray-400">
          Création
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau compte</h1>
      </div>
      <HydrationBoundary state={dehydrate(qc)}>
        <AccountCreateForm />
      </HydrationBoundary>
    </div>
  );
}
