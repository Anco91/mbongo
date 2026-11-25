/**
 * Dashboard Guard Component
 *
 * Server container: prefetches accounts, transactions, charges,
 * payments, transfers, and members to hydrate the dashboard client view.
 *
 * @module Components/Dashboard/DashboardGuard
 */

import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { chargeService } from '@/server/charges/charge.service';
import { paymentService } from '@/server/payments/payment.service';
import { transferService } from '@/server/transfers/transfer.service';
import { memberService } from '@/server/members/member.service';
import { currentMonthKey } from '@/lib/month-navigation';
import { monthPaymentsQuery } from '@/lib/month-queries';
import { pendingUntilQuery } from '@/queries/payments';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
import { JSX } from 'react';

export function DashboardGuard({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  // Le mois du curseur démarre sur le mois courant : la fenêtre d'échéances
  // du guard est exactement celle du hook client (design D5).
  const monthQuery = monthPaymentsQuery(currentMonthKey());

  const pendingQuery = pendingUntilQuery(currentMonthKey());

  const entries: PrefetchEntry[] = [
    {
      queryKey: ['accounts', {}],
      queryFn: () => accountService.findMany({}),
    },
    {
      queryKey: ['transactions', {}],
      queryFn: () => transactionService.findMany({}),
    },
    {
      queryKey: ['charges', {}],
      queryFn: () => chargeService.findMany({}),
    },
    {
      queryKey: ['payments', monthQuery],
      queryFn: () => paymentService.findMany(monthQuery),
    },
    {
      queryKey: ['payments', pendingQuery],
      queryFn: () => paymentService.findMany(pendingQuery),
    },
    {
      queryKey: ['transfers', {}],
      queryFn: () => transferService.findMany({}),
    },
    {
      queryKey: ['members'],
      queryFn: () => memberService.findMany(),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
