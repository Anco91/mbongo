/**
 * Payment Queries
 *
 * Query factory for payments: the only source of their query keys and
 * `queryOptions`. Keys match the guards' server prefetch.
 *
 * @module Queries/Payments
 */

import { queryOptions } from '@tanstack/react-query';
import { paymentsRepository } from '@/repositories/payments.repository';
import { monthBounds } from '@/lib/month-navigation';
import { PAYMENTS_WINDOW_LIMIT } from '@/lib/month-queries';
import type { PaymentQuery } from '@mbongo/shared';

const KEY = 'payments' as const;

/** PENDING payments due up to the end of a month ('YYYY-MM'), overdue included. */
export function pendingUntilQuery(monthKey: string): PaymentQuery {
  return {
    status: { eq: 'PENDING' },
    dueDate: { lte: monthBounds(monthKey).end.toISOString() },
    limit: PAYMENTS_WINDOW_LIMIT,
  };
}

export const paymentQueries = {
  all: () => [KEY] as const,
  list: (query: PaymentQuery = {}) =>
    queryOptions({
      queryKey: [KEY, query] as const,
      queryFn: () => paymentsRepository.findMany(query),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [KEY, id] as const,
      queryFn: () => paymentsRepository.findOne(id),
      enabled: Boolean(id),
    }),
  pendingUntil: (monthKey: string) =>
    queryOptions({
      queryKey: [KEY, pendingUntilQuery(monthKey)] as const,
      queryFn: () => paymentsRepository.findMany(pendingUntilQuery(monthKey)),
    }),
  byCharge: (chargeId: string) =>
    queryOptions({
      queryKey: [KEY, { chargeId }] as const,
      queryFn: () =>
        paymentsRepository.findMany({ chargeId: { eq: chargeId } }),
      enabled: Boolean(chargeId),
    }),
};
