/**
 * Use Charges Hook
 *
 * React Query hooks for managing charges data.
 * These are the only consumers of /api routes on the client side.
 *
 * @module Components/Charges/Hooks/UseCharges
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chargesRepository } from '@/repositories/charges.repository';
import { paymentsRepository } from '@/repositories/payments.repository';
import {
  CreateChargeInput,
  UpdateChargeInput,
  Payment,
  ChargeQuery,
  nextPayment,
  generatePayments,
} from '@mbongo/shared';
import { formatISO } from 'date-fns';

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key for charges
 */
const CHARGE_KEY = 'charges';

/**
 * Generate query key for a single charge
 */
const chargeKey = (id: string) => [CHARGE_KEY, id];

/**
 * Generate query key for charge payments
 */
const chargePaymentsKey = (id: string) => ['payments', { chargeId: id }];

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get all charges
 *
 * @param query - Optional query parameters
 * @returns Query result with charges array
 *
 * @example
 * ```tsx
 * const { data: charges, isLoading, error } = useCharges();
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error error={error} />;
 * return <ChargeList charges={charges} />;
 * ```
 */
export function useCharges(query: ChargeQuery = {}) {
  return useQuery({
    queryKey: [CHARGE_KEY, query],
    queryFn: () => chargesRepository.findMany(query),
  });
}

/**
 * Get a single charge by ID
 *
 * @param id - Charge ID
 * @returns Query result with charge or undefined
 *
 * @example
 * ```tsx
 * const { data: charge } = useCharge('abc123');
 * ```
 */
export function useCharge(id: string) {
  return useQuery({
    queryKey: chargeKey(id),
    queryFn: () => chargesRepository.findOne(id),
    enabled: !!id,
  });
}

/**
 * Get payments for a charge
 *
 * @param id - Charge ID
 * @returns Query result with payments array
 *
 * @example
 * ```tsx
 * const { data: payments } = useChargePayments('abc123');
 * ```
 */
export function useChargePayments(id: string) {
  return useQuery({
    queryKey: chargePaymentsKey(id),
    queryFn: () => paymentsRepository.findMany({ chargeId: { eq: id } }),
    enabled: !!id,
  });
}

/**
 * Get next payment for a charge
 *
 * @param id - Charge ID
 * @returns Query result with next payment or null
 *
 * @example
 * ```tsx
 * const { data: nextPayment } = useNextPayment('abc123');
 * ```
 */
export function useNextPayment(id: string) {
  return useQuery({
    queryKey: chargePaymentsKey(id),
    queryFn: () =>
      paymentsRepository.findMany({
        chargeId: { eq: id },
        status: { eq: 'PENDING' },
      }),
    select: (payments: Payment[]) => nextPayment(payments, new Date()),
    enabled: !!id,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new charge
 *
 * @returns Mutation object with create function
 *
 * @example
 * ```tsx
 * const { mutate: createCharge, isPending } = useCreateCharge();
 *
 * const handleSubmit = (data: CreateChargeInput) => {
 *   createCharge(data, {
 *     onSuccess: () => {
 *       // Invalidate charges list to refetch
 *     },
 *   });
 * };
 * ```
 */
export function useCreateCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateChargeInput) => {
      const charge = await chargesRepository.create(input);
      const payments = generatePayments(charge, new Date());
      if (payments.length > 0) await paymentsRepository.createMany(payments);
      return charge;
    },
    onSuccess: () => {
      // Invalidate all charges queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: [CHARGE_KEY] });
    },
  });
}

/**
 * Update a charge
 *
 * @param id - Charge ID
 * @returns Mutation object with update function
 *
 * @example
 * ```tsx
 * const { mutate: updateCharge } = useUpdateCharge('abc123');
 *
 * updateCharge({ label: 'New Label' });
 * ```
 */
export function useUpdateCharge(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateChargeInput) =>
      chargesRepository.update(id, input),
    onSuccess: (charge) => {
      // Invalidate single charge query
      queryClient.invalidateQueries({ queryKey: chargeKey(id) });
      // Invalidate charges list
      queryClient.invalidateQueries({ queryKey: [CHARGE_KEY] });
    },
  });
}

/**
 * Delete a charge
 *
 * @returns Mutation object with delete function
 *
 * @example
 * ```tsx
 * const { mutate: deleteCharge } = useDeleteCharge();
 *
 * deleteCharge('abc123');
 * ```
 */
export function useDeleteCharge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chargesRepository.remove(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: chargeKey(id) });
      // Invalidate charges list
      queryClient.invalidateQueries({ queryKey: [CHARGE_KEY] });
    },
  });
}

/**
 * Mark a payment as paid
 *
 * @returns Mutation object with markPaid function
 *
 * @example
 * ```tsx
 * const { mutate: markPaid } = useMarkPaymentAsPaid();
 *
 * markPaid({ chargeId: 'abc123', paymentId: 'xyz789' });
 * ```
 */
export function useMarkPaymentAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chargeId,
      paymentId,
    }: {
      chargeId: string;
      paymentId: string;
    }) =>
      paymentsRepository.update(paymentId, {
        status: 'PAID',
        paidAt: formatISO(new Date()),
      }),
    onSuccess: (_data, { chargeId }) => {
      // Invalidate payments for this charge
      return queryClient.invalidateQueries({
        queryKey: chargePaymentsKey(chargeId),
      });
    },
  });
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Prefetch charges for server-side rendering
 *
 * @param queryClient - React Query client
 * @param query - Optional query parameters
 * @returns Promise that resolves when data is prefetched
 *
 * @example
 * ```tsx
 * // In a Server Component:
 * export async function ChargesPage() {
 *   const queryClient = new QueryClient();
 *   await prefetchCharges(queryClient);
 *   return (
 *     <HydrationBoundary state={dehydrate(queryClient)}>
 *       <ChargesView />
 *     </HydrationBoundary>
 *   );
 * }
 * ```
 */
export async function prefetchCharges(
  queryClient: import('@tanstack/react-query').QueryClient,
  query: ChargeQuery = {}
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: [CHARGE_KEY, query],
    queryFn: () => chargesRepository.findMany(query),
  });
}

/**
 * Prefetch a single charge
 */
export async function prefetchCharge(
  queryClient: import('@tanstack/react-query').QueryClient,
  id: string
): Promise<void> {
  if (!id) return;

  await queryClient.prefetchQuery({
    queryKey: chargeKey(id),
    queryFn: () => chargesRepository.findOne(id),
  });
}

/**
 * Prefetch charge payments
 */
export async function prefetchChargePayments(
  queryClient: import('@tanstack/react-query').QueryClient,
  id: string
): Promise<void> {
  if (!id) return;

  await queryClient.prefetchQuery({
    queryKey: chargePaymentsKey(id),
    queryFn: () => paymentsRepository.findMany({ chargeId: { eq: id } }),
  });
}

// ============================================================================
// Exports
// ============================================================================

export { CHARGE_KEY, chargeKey, chargePaymentsKey };
