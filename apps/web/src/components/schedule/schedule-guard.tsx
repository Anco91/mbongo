/**
 * Schedule Guard Component
 *
 * Server container: data guaranteed before render.
 * Prefetches payments (60-day window), charges, accounts and transactions
 * on the server, then hydrates the client view. The virtual card billing
 * entries (encours carte) are MERGED in the view — see schedule-view.
 *
 * @module Components/Schedule/ScheduleGuard
 */

import { chargeService } from '@/server/charges/charge.service';
import { paymentService } from '@/server/payments/payment.service';
import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { addDays, startOfDay } from 'date-fns';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
import { JSX } from 'react';

/**
 * ScheduleGuard Component
 *
 * This is a Server Component that:
 * 1. Declares the schedule entries (server-side services)
 * 2. Delegates prefetch and hydration to PrefetchGuard
 *
 * The payment window covers the 60 next days PLUS the 60 past days: a
 * PENDING payment whose due date is already passed must stay visible with
 * its derived « dû » status (spec payment-schedule).
 *
 * @returns JSX Element
 */
export function ScheduleGuard({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const today = startOfDay(new Date());
  const windowEnd = addDays(today, 60);
  const windowStart = addDays(today, -60);

  const paymentQuery = {
    status: { eq: 'PENDING' as const },
    dueDate: { gte: windowStart.toISOString(), lte: windowEnd.toISOString() },
  };
  const transactionQuery = {
    dateFrom: windowStart.toISOString(),
    dateTo: windowEnd.toISOString(),
  };

  const entries: PrefetchEntry[] = [
    {
      queryKey: ['payments', paymentQuery],
      queryFn: () => paymentService.findMany(paymentQuery),
    },
    {
      queryKey: ['charges', {}],
      queryFn: () => chargeService.findMany({}),
    },
    {
      queryKey: ['accounts', {}],
      queryFn: () => accountService.findMany({}),
    },
    {
      queryKey: ['transactions', transactionQuery],
      queryFn: () => transactionService.findMany(transactionQuery),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
