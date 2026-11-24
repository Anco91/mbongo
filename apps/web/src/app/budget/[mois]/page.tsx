/**
 * Budget Preparation Page
 *
 * Server component for the budget preparation wizard.
 * Validates monthKey and prefetches data using server-side services
 * (same pattern as DashboardGuard / ChargesGuard).
 *
 * @module App/Budget/Page
 */

import {
  HydrationBoundary,
  dehydrate,
  QueryClient,
} from '@tanstack/react-query';
import { isValidMonthKey, monthLongLabel } from '@/lib/month-navigation';
import { notFound } from 'next/navigation';
import { BudgetGuard } from '@/components/budget/budget-guard';
import { accountService } from '@/server/accounts/account.service';
import { chargeService } from '@/server/charges/charge.service';
import { paymentService } from '@/server/payments/payment.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { incomeService } from '@/server/incomes/income.service';
import { monthlyBudgetService } from '@/server/monthly-budgets/monthly-budget.service';
import {
  monthPaymentsQuery,
  monthTransactionsQuery,
} from '@/lib/month-queries';
import { JSX } from 'react';

interface BudgetPageProps {
  params: Promise<{ mois: string }>;
}

export default async function BudgetPage({
  params,
}: BudgetPageProps): Promise<JSX.Element> {
  const { mois } = await params;

  // Validate monthKey
  if (!isValidMonthKey(mois)) {
    notFound();
  }

  const qc = new QueryClient();
  const monthLabel = monthLongLabel(mois);
  // Fenêtre d'échéances du mois préparé : même requête typée que le hook
  // client (design D5) — le préfixe ['payments'] reste invalide par mutation.
  const paymentsQuery = monthPaymentsQuery(mois);
  const transactionsQuery = monthTransactionsQuery(mois);

  // Prefetch data using server-side services (not fetch — avoids relative URL 500)
  // Query keys match the client hooks exactly so prefetched data is reused.
  await Promise.all([
    qc.prefetchQuery({
      queryKey: ['accounts', {}],
      queryFn: () => accountService.findMany({}),
    }),
    qc.prefetchQuery({
      queryKey: ['charges', {}],
      queryFn: () => chargeService.findMany({}),
    }),
    qc.prefetchQuery({
      queryKey: ['payments', paymentsQuery],
      queryFn: () => paymentService.findMany(paymentsQuery),
    }),
    qc.prefetchQuery({
      queryKey: ['transactions', transactionsQuery],
      queryFn: () => transactionService.findMany(transactionsQuery),
    }),
    qc.prefetchQuery({
      queryKey: ['incomes', { month: mois }],
      queryFn: () => incomeService.findMany({ month: mois }),
    }),
    qc.prefetchQuery({
      queryKey: ['monthly-budgets', mois],
      queryFn: () => monthlyBudgetService.findOne(mois),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <BudgetGuard month={mois} monthLabel={monthLabel} />
    </HydrationBoundary>
  );
}
