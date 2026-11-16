/**
 * Charge Creation Page
 *
 * Dedicated creation page (one page, one responsibility — mock_POC).
 * The guard hydrates the accounts used by the debit account selector.
 *
 * @module App/Dashboard/Charges/New
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { accountService } from '@/server/accounts/account.service';
import { ChargeCreateForm } from '@/components/charges/charge-create-form';
import { JSX } from 'react';

export default async function NewChargePage(): Promise<JSX.Element> {
  const qc = new QueryClient();

  await qc.prefetchQuery({
    queryKey: ['accounts', {}],
    queryFn: () => accountService.findMany({}),
  });

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-gray-400">
          Création
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle charge</h1>
      </div>
      <HydrationBoundary state={dehydrate(qc)}>
        <ChargeCreateForm />
      </HydrationBoundary>
    </div>
  );
}
