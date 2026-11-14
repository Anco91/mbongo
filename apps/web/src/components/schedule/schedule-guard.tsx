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

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { chargeService } from '@/server/charges/charge.service';
import { paymentService } from '@/server/payments/payment.service';
import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { addDays, startOfDay } from 'date-fns';
import { ScheduleView } from './schedule-view';
import { JSX } from 'react';

/**
 * ScheduleGuard Component
 *
 * This is a Server Component that:
 * 1. Creates a QueryClient instance
 * 2. Prefetches schedule data using the server-side services
 * 3. Provides the data to client components via HydrationBoundary
 *
 * The payment window covers the 60 next days PLUS the 60 past days: a
 * PENDING payment whose due date is already passed must stay visible with
 * its derived « dû » status (spec payment-schedule).
 *
 * @returns JSX Element
 */
export async function ScheduleGuard(): Promise<JSX.Element> {
  const qc = new QueryClient();
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

  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['payments', paymentQuery],
      queryFn: () => paymentService.findMany(paymentQuery),
    }),
    qc.prefetchQuery({
      queryKey: ['charges', {}],
      queryFn: () => chargeService.findMany({}),
    }),
    qc.prefetchQuery({
      queryKey: ['accounts', {}],
      queryFn: () => accountService.findMany({}),
    }),
    qc.prefetchQuery({
      queryKey: ['transactions', transactionQuery],
      queryFn: () => transactionService.findMany(transactionQuery),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ScheduleView />
    </HydrationBoundary>
  );
}
