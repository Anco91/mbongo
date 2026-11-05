/**
 * Charges Guard Component
 * 
 * Server container: data guaranteed before render.
 * This component prefetches charges data on the server and provides it to the client.
 * 
 * @module Components/Charges/ChargesGuard
 */

import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { chargeService } from '@/server/charges/charge.service';
import { ChargesView } from './charges-view';
import { ChargeQuery } from '@mbongo/shared';

/**
 * Props for ChargesGuard
 */
interface ChargesGuardProps {
  query?: ChargeQuery;
}

/**
 * ChargesGuard Component
 * 
 * This is a Server Component that:
 * 1. Creates a QueryClient instance
 * 2. Prefetches charges data using the server-side chargeService
 * 3. Provides the data to client components via HydrationBoundary
 * 
 * @param props - Component props
 * @returns JSX Element
 * 
 * @example
 * ```tsx
 * // In app/(dashboard)/charges/page.tsx:
 * import { ChargesGuard } from '@/components/charges/charges-guard';
 * 
 * export default function ChargesPage() {
 *   return <ChargesGuard />;
 * }
 * ```
 */
export async function ChargesGuard({ query = {} }: ChargesGuardProps) {
  // Create a new QueryClient for each request
  const qc = new QueryClient();

  // Prefetch charges data using server-side service
  // This calls the database directly, not the API
  await qc.prefetchQuery({
    queryKey: ['charges', query],
    queryFn: () => chargeService.findMany(query),
  });

  // Render the client-side view with hydration
  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <ChargesView />
    </HydrationBoundary>
  );
}
