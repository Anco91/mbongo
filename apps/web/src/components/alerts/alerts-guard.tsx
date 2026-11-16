/**
 * Alerts Guard Component
 *
 * Server container: prefetches accounts, transactions, charges and
 * payments to hydrate the dedicated alerts view (direct route, same
 * pattern as the dashboard guard — transfers are not needed by
 * computeAlerts).
 *
 * @module Components/Alerts/AlertsGuard
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { chargeService } from '@/server/charges/charge.service';
import { paymentService } from '@/server/payments/payment.service';
import { JSX } from 'react';

export async function AlertsGuard({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const qc = new QueryClient();

  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['accounts', {}],
      queryFn: () => accountService.findMany({}),
    }),
    qc.prefetchQuery({
      queryKey: ['transactions', {}],
      queryFn: () => transactionService.findMany({}),
    }),
    qc.prefetchQuery({
      queryKey: ['charges', {}],
      queryFn: () => chargeService.findMany({}),
    }),
    qc.prefetchQuery({
      queryKey: ['payments', {}],
      queryFn: () => paymentService.findMany({}),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
