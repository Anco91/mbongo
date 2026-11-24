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
import type { PaymentQuery } from '@mbongo/shared';

const KEY = 'payments' as const;

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
  byCharge: (chargeId: string) =>
    queryOptions({
      queryKey: [KEY, { chargeId }] as const,
      queryFn: () =>
        paymentsRepository.findMany({ chargeId: { eq: chargeId } }),
      enabled: Boolean(chargeId),
    }),
};
