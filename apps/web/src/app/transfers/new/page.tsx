/**
 * Transfer Creation Page
 *
 * Dedicated creation page (one page, one responsibility — mock_POC).
 * The guard hydrates the accounts used by the currency-constrained selectors.
 *
 * @module App/Dashboard/Transfers/New
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { accountService } from '@/server/accounts/account.service';
import { TransferCreateForm } from '@/components/transfers/transfer-create-form';
import { JSX } from 'react';

export default async function NewTransferPage(): Promise<JSX.Element> {
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
        <h1 className="text-2xl font-bold text-gray-900">Nouveau transfert</h1>
        <p className="text-sm text-gray-500">
          Phase 1 — envoi estimé. Le crédit reçu sera enregistré en phase 2
          depuis la liste.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(qc)}>
        <TransferCreateForm />
      </HydrationBoundary>
    </div>
  );
}
