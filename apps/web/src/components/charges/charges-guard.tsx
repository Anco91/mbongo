/**
 * Charges Guard Component
 *
 * Server container: data guaranteed before render.
 * This component prefetches charges data on the server and provides it to the client.
 *
 * @module Components/Charges/ChargesGuard
 */

import { chargeService } from '@/server/charges/charge.service';
import { ChargeQuery } from '@mbongo/shared';
import {
  PrefetchGuard,
  type PrefetchEntry,
} from '@/components/patterns/prefetch-guard';
import { JSX } from 'react';

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
 * 1. Declares the charges entry (server-side chargeService)
 * 2. Delegates prefetch and hydration to PrefetchGuard
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
export function ChargesGuard({
  query = {},
  children,
}: ChargesGuardProps & { children: React.ReactNode }): JSX.Element {
  // Server-side service: calls the database directly, not the API
  const entries: PrefetchEntry[] = [
    {
      queryKey: ['charges', query],
      queryFn: () => chargeService.findMany(query),
    },
  ];

  return <PrefetchGuard entries={entries}>{children}</PrefetchGuard>;
}
