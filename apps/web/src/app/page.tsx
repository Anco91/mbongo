/**
 * Dashboard Page (home route)
 *
 * Server Component rendering the DashboardGuard (prefetch + hydration).
 * Consolidated wealth, monthly flows (Sankey), category donut,
 * upcoming payments of the month, provisions card and alerts banner.
 *
 * @module App/Dashboard
 */

import { DashboardView } from '@/components/dashboard/dashboard-view';
import { JSX } from 'react';

export default function DashboardPage(): JSX.Element {
  return <DashboardView />;
}
