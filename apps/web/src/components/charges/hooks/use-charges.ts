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
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { chargesRepository } from '@/repositories/charges.repository';
import { paymentsRepository } from '@/repositories/payments.repository';
import {
  Charge,
  CreateChargeInput,
  UpdateChargeInput,
  Payment,
  ChargeQuery,
  missingPayments,
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

type ChargesQuery = UseQueryResult<Charge[], Error>;
type ChargeQueryResult = UseQueryResult<Charge, Error>;
type ChargePaymentsQuery = UseQueryResult<Payment[], Error>;
type NextPaymentQuery = UseQueryResult<Payment | null, Error>;

/**
 * Generate query key for a single charge
 */
function chargeKey(id: string): string[] {
  return [CHARGE_KEY, id];
}

/**
 * Generate query key for charge payments
 */
function chargePaymentsKey(id: string): unknown[] {
  return ['payments', { chargeId: id }];
}

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
export function useCharges(query: ChargeQuery = {}): ChargesQuery {
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
export function useCharge(id: string): ChargeQueryResult {
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
export function useChargePayments(id: string): ChargePaymentsQuery {
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
export function useNextPayment(id: string): NextPaymentQuery {
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
 * Résultat de la création d'une charge.
 *
 * Si la création groupée des échéances échoue, la charge créée est
 * conservée avec l'erreur correspondante pour permettre une reprise
 * depuis l'UI (spec M2-CHARGE-PAYMENTS-001, § Cohérence de création).
 */
export interface CreateChargeResult {
  charge: Charge;
  paymentsError: Error | null;
}

/**
 * Convertit une erreur inconnue en Error typée.
 */
function toError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error('Failed to create payments for the charge');
}

/**
 * Create a new charge
 *
 * Retourne toujours la charge créée : si la génération ou la persistance
 * des échéances échoue, `paymentsError` est renseigné au lieu de lever,
 * afin que l'UI puisse proposer de reprendre les échéances manquantes.
 *
 * @returns Mutation object with create function
 *
 * @example
 * ```tsx
 * const { mutate: createCharge, isPending } = useCreateCharge();
 *
 * createCharge(data, {
 *   onSuccess: ({ charge, paymentsError }) => {
 *     if (paymentsError) showPaymentRecovery(charge);
 *   },
 * });
 * ```
 */
export function useCreateCharge(): UseMutationResult<
  CreateChargeResult,
  Error,
  CreateChargeInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: CreateChargeInput
    ): Promise<CreateChargeResult> => {
      const charge = await chargesRepository.create(input);
      const payments = generatePayments(charge, new Date());
      if (payments.length === 0) {
        return { charge, paymentsError: null };
      }
      try {
        await paymentsRepository.createMany(payments);
        return { charge, paymentsError: null };
      } catch (error: unknown) {
        return { charge, paymentsError: toError(error) };
      }
    },
    onSuccess: async () => {
      // Invalidate all charges queries to trigger refetch
      await queryClient.invalidateQueries({ queryKey: [CHARGE_KEY] });
    },
  });
}

/**
 * Reprend la création des échéances manquantes d'une charge.
 *
 * La fonction partagée `missingPayments` ne renvoie que les échéances
 * non persistées : si tout est déjà en base, aucune écriture n'est émise.
 *
 * @returns Mutation object with retry function
 *
 * @example
 * ```tsx
 * const { mutateAsync: retryPayments, isPending } = useRetryChargePayments();
 *
 * const recovery = async (charge: Charge) => {
 *   await retryPayments(charge);
 * };
 * ```
 */
export function useRetryChargePayments(): UseMutationResult<
  Payment[],
  Error,
  Charge
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (charge: Charge): Promise<Payment[]> => {
      const existing = await paymentsRepository.findMany({
        chargeId: { eq: charge.id },
      });
      const missing = missingPayments(charge, existing, new Date());
      if (missing.length === 0) return [];
      return paymentsRepository.createMany(missing);
    },
    onSuccess: async (_payments, charge) => {
      // Invalidate payments for this charge
      await queryClient.invalidateQueries({
        queryKey: chargePaymentsKey(charge.id),
      });
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
    onSuccess: async () => {
      // Invalidate single charge query
      await queryClient.invalidateQueries({ queryKey: chargeKey(id) });
      // Invalidate charges list
      await queryClient.invalidateQueries({ queryKey: [CHARGE_KEY] });
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
    onSuccess: async (_data, chargeId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: chargeKey(chargeId) });
      // Invalidate charges list
      await queryClient.invalidateQueries({ queryKey: [CHARGE_KEY] });
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
    mutationFn: ({
      paymentId,
    }: {
      chargeId: string;
      paymentId: string;
    }): Promise<Payment> =>
      paymentsRepository.update(paymentId, {
        status: 'PAID',
        paidAt: formatISO(new Date()),
      }),
    onSuccess: async (_payment, { chargeId }) => {
      // Invalidate payments for this charge
      await queryClient.invalidateQueries({
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
