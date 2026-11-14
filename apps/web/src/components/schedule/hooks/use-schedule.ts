/**
 * Use Schedule Hook
 *
 * React Query hooks for the payment schedule (échéancier).
 * Domain hooks only — components never call the API directly (R8).
 *
 * @module Components/Schedule/Hooks/UseSchedule
 */

'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { paymentsRepository } from '@/repositories/payments.repository';
import { transactionsRepository } from '@/repositories/transactions.repository';
import type {
  Payment,
  PaymentQuery,
  Transaction,
  TransactionQuery,
  UpdatePaymentInput,
} from '@mbongo/shared';

const PAYMENTS_KEY = 'payments';
const TRANSACTIONS_KEY = 'transactions';

/**
 * List payments (filtered by the query — status, dueDate window, charge).
 */
export function usePayments(
  query: PaymentQuery = {}
): UseQueryResult<Payment[], Error> {
  return useQuery({
    queryKey: [PAYMENTS_KEY, query],
    queryFn: () => paymentsRepository.findMany(query),
  });
}

/**
 * Get a single payment by ID.
 */
export function usePayment(id: string): UseQueryResult<Payment, Error> {
  return useQuery({
    queryKey: [PAYMENTS_KEY, id],
    queryFn: () => paymentsRepository.findOne(id),
    enabled: Boolean(id),
  });
}

/**
 * List transactions (candidates for reconciliation, card cycles).
 */
export function useTransactions(
  query: TransactionQuery = {}
): UseQueryResult<Transaction[], Error> {
  return useQuery({
    queryKey: [TRANSACTIONS_KEY, query],
    queryFn: () => transactionsRepository.findMany(query),
  });
}

/**
 * Update a payment (manual PAID check, back to PENDING), then refresh.
 */
export function useUpdatePayment(): UseMutationResult<
  Payment,
  Error,
  { id: string; input: UpdatePaymentInput }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePaymentInput }) =>
      paymentsRepository.update(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
    },
  });
}

/**
 * Reconcile a payment with a transaction (M2, spec payment-schedule),
 * then refresh.
 */
export function useReconcilePayment(): UseMutationResult<
  Payment,
  Error,
  { id: string; transactionId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      transactionId,
    }: {
      id: string;
      transactionId: string;
    }) => paymentsRepository.reconcile(id, transactionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      await queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });
    },
  });
}

/**
 * Unlink a reconciled payment (back to PENDING), then refresh.
 */
export function useUnlinkPayment(): UseMutationResult<Payment, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentsRepository.unlink(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [PAYMENTS_KEY] });
      await queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });
    },
  });
}
