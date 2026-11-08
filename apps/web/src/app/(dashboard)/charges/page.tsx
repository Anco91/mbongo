/**
 * Charges Dashboard Page
 *
 * Server Component that displays the charges dashboard.
 * Uses the ChargesGuard to prefetch data on the server.
 *
 * @module App/Dashboard/Charges
 */

import { ChargesGuard } from '@/components/charges/charges-guard';

/**
 * Charges Dashboard Page Component
 *
 * This is a Server Component (RSC) that:
 * 1. Renders the ChargesGuard which prefetches data
 * 2. Provides the data to client components via HydrationBoundary
 * 3. Can be customized with query parameters
 *
 * @example
 * ```tsx
 * // Access via: /charges
 * // With query params: /charges?type[eq]=FIXED_RECURRING&limit=10
 * ```
 */
export default function ChargesPage(): JSX.Element {
  // In a real app, you could extract query params from searchParams
  // For now, we just use the default ChargesGuard
  return <ChargesGuard />;
}
