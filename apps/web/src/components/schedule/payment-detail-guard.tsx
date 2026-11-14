/**
 * Payment Detail Guard Component
 *
 * Server container: the payment, its charge, its account and the
 * transactions of that account (± 60 days around the due date) are
 * guaranteed before render. The candidate filtering itself stays in the
 * pure `reconciliationCandidates` function (M2, spec payment-schedule).
 *
 * @module Components/Schedule/PaymentDetailGuard
 */

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { paymentService } from '@/server/payments/payment.service';
import { chargeService } from '@/server/charges/charge.service';
import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { addDays, parseISO } from 'date-fns';
import { PaymentDetailView } from './payment-detail-view';
import { JSX } from 'react';

/**
 * PaymentDetailGuard Component
 *
 * @param props.id - The payment ID
 * @returns JSX Element
 */
export async function PaymentDetailGuard({
  id,
}: {
  id: string;
}): Promise<JSX.Element> {
  const qc = new QueryClient();

  const payment = await paymentService.findOne(id);
  const charge = await chargeService.findOne(payment.chargeId);
  const account = await accountService.findOne(charge.accountId);

  // Fenêtre large : la pure function garde la décision (± 7 jours).
  const dueDate = parseISO(payment.dueDate);
  const transactionQuery = {
    accountId: { eq: charge.accountId },
    dateFrom: addDays(dueDate, -60).toISOString(),
    dateTo: addDays(dueDate, 60).toISOString(),
  };

  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['payments', id],
      queryFn: () => paymentService.findOne(id),
    }),
    qc.prefetchQuery({
      queryKey: ['charges', charge.id],
      queryFn: () => chargeService.findOne(charge.id),
    }),
    qc.prefetchQuery({
      queryKey: ['accounts', account.id],
      queryFn: () => accountService.findOne(account.id),
    }),
    qc.prefetchQuery({
      queryKey: ['transactions', transactionQuery],
      queryFn: () => transactionService.findMany(transactionQuery),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <PaymentDetailView paymentId={id} accountId={charge.accountId} />
    </HydrationBoundary>
  );
}
