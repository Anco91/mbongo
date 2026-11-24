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

import { format } from 'date-fns';
import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { chargeService } from '@/server/charges/charge.service';
import { paymentService } from '@/server/payments/payment.service';
import { alertsPaymentsQuery } from '@/lib/month-queries';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
import { JSX } from 'react';

export function AlertsGuard({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  // La fenêtre d'alertes du guard est exactement celle du hook client
  // (design D5) : PENDING jusqu'à J+30, retard inclus.
  const alertsQuery = alertsPaymentsQuery(format(new Date(), 'yyyy-MM-dd'));

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
      queryKey: ['payments', alertsQuery],
      queryFn: () => paymentService.findMany(alertsQuery),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
