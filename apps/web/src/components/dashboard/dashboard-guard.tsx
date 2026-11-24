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
import { currentMonthKey } from '@/lib/month-navigation';
import { monthPaymentsQuery } from '@/lib/month-queries';
import { JSX } from 'react';

export async function DashboardGuard({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const qc = new QueryClient();

  // Le mois du curseur démarre sur le mois courant : la fenêtre d'échéances
  // du guard est exactement celle du hook client (design D5).
  const monthQuery = monthPaymentsQuery(currentMonthKey());

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
      queryKey: ['payments', monthQuery],
      queryFn: () => paymentService.findMany(monthQuery),
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
