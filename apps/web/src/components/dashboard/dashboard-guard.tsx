/**
 * Dashboard Guard Component
 *
 * Server container: prefetches accounts, transactions, charges,
 * payments, transfers, and members to hydrate the dashboard client view.
 *
 * @module Components/Dashboard/DashboardGuard
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
import { transferService } from '@/server/transfers/transfer.service';
import { memberService } from '@/server/members/member.service';
import { JSX } from 'react';

export async function DashboardGuard({
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
    qc.prefetchQuery({
      queryKey: ['transfers', {}],
      queryFn: () => transferService.findMany({}),
    }),
    qc.prefetchQuery({
      queryKey: ['members'],
      queryFn: () => memberService.findMany(),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>{children}</HydrationBoundary>
  );
}
