/**
 * Payment Detail Guard Component
 *
 * Server container: the payment, its charge, its account and the
 * transactions of that account (± 60 days around the due date) are
 * guaranteed before render. The candidate filtering itself stays in the
 * pure `reconciliationCandidates` function (M2, spec payment-schedule).
 *
 * @module Components/Payments/PaymentDetailGuard
 */

import { paymentService } from '@/server/payments/payment.service';
import { chargeService } from '@/server/charges/charge.service';
import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { addDays, parseISO } from 'date-fns';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
import { JSX } from 'react';

/**
 * PaymentDetailGuard Component
 *
 * @param props.id - The payment ID
 * @param props.children - Content rendered inside the hydration boundary
 * @returns JSX Element
 */
export async function PaymentDetailGuard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}): Promise<JSX.Element> {
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

  const entries: PrefetchEntry[] = [
    {
      queryKey: ['payments', id],
      queryFn: () => paymentService.findOne(id),
    },
    {
      queryKey: ['charges', charge.id],
      queryFn: () => chargeService.findOne(charge.id),
    },
    {
      queryKey: ['accounts', account.id],
      queryFn: () => accountService.findOne(account.id),
    },
    {
      queryKey: ['transactions', transactionQuery],
      queryFn: () => transactionService.findMany(transactionQuery),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
