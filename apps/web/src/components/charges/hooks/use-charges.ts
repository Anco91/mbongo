/**
 * Use Charges Hook
 *
 * React Query hooks for managing charges data.
 * These are the only consumers of /api routes on the client side.
 *
 * @module Components/Charges/Hooks/UseCharges
 */

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { chargesRepository } from '@/repositories/charges.repository';
import { paymentsRepository } from '@/repositories/payments.repository';
import {
  Charge,
  CreateChargeInput,
  UpdateChargeInput,
  Payment,
  ChargeQuery,
  nextPayment,
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
const chargeKey = (id: string): [string, string] => [CHARGE_KEY, id];

/**
 * Generate query key for charge payments
 */
const chargePaymentsKey = (id: string): [string, { chargeId: string }] => [
  'payments',
  { chargeId: id },
];

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
export function useCharges(
  query: ChargeQuery = {}
): UseQueryResult<Charge[], Error> {
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
export function useCharge(id: string): UseQueryResult<Charge, Error> {
  return useQuery({
    queryKey: chargeKey(id),
    queryFn: () => chargesRepository.findOne(id),
    enabled: Boolean(id),
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
export function useChargePayments(
  id: string
): UseQueryResult<Payment[], Error> {
  return useQuery({
    queryKey: chargePaymentsKey(id),
    queryFn: () => paymentsRepository.findMany({ chargeId: { eq: id } }),
    enabled: Boolean(id),
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
export function useNextPayment(
  id: string
): UseQueryResult<Payment | null, Error> {
  return useQuery({
    queryKey: chargePaymentsKey(id),
    queryFn: () =>
      paymentsRepository.findMany({
        chargeId: { eq: id },
        status: { eq: 'PENDING' },
      }),
    select: (payments: Payment[]) => nextPayment(payments, new Date()),
    enabled: Boolean(id),
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Create a new charge
 *
 * La création est transactionnelle côté serveur (M2, design D5) : la charge
 * et ses échéances sont créées tout-ou-rien dans un seul appel. Un échec
 * laisse la base inchangée — il suffit de resoumettre le formulaire.
 *
 * @returns Mutation object with create function
 *
 * @example
 * ```tsx
 * const { mutate: createCharge, isPending } = useCreateCharge();
 *
 * createCharge(data, {
 *   onSuccess: (charge) => router.push('/charges'),
 * });
 * ```
 */
export function useCreateCharge(): UseMutationResult<
  Charge,
  Error,
  CreateChargeInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChargeInput): Promise<Charge> =>
      chargesRepository.create(input),
    onSuccess: async () => {
      // Invalidate all charges queries to trigger refetch
      await queryClient.invalidateQueries({ queryKey: [CHARGE_KEY] });
      await queryClient.invalidateQueries({ queryKey: ['payments'] });
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
export function useUpdateCharge(
  id: string
): UseMutationResult<Charge, Error, UpdateChargeInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateChargeInput) =>
      chargesRepository.update(id, input),
    onSuccess: (_charge) => {
      // Invalidate single charge query
      void queryClient.invalidateQueries({ queryKey: chargeKey(id) });
      // Invalidate charges list
      void queryClient.invalidateQueries({ queryKey: [CHARGE_KEY] });
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
export function useDeleteCharge(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chargeId: string) => chargesRepository.remove(chargeId),
    onSuccess: (_data, chargeId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: chargeKey(chargeId) });
      // Invalidate charges list
      void queryClient.invalidateQueries({ queryKey: [CHARGE_KEY] });
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
export function useMarkPaymentAsPaid(): UseMutationResult<
  Payment,
  Error,
  { chargeId: string; paymentId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId }: { chargeId: string; paymentId: string }) =>
      paymentsRepository.update(paymentId, {
        status: 'PAID',
        paidAt: formatISO(new Date()),
      }),
    onSuccess: (_payment, { chargeId }) => {
      // Invalidate payments for this charge
      void queryClient.invalidateQueries({
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
