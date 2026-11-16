/**
 * Dashboard View Component
 *
 * Composition shell: page → View → Guard (children) → Content.
 * The Guard prefetches via the server-side services and renders
 * the client Content inside the hydration boundary.
 *
 * @module Components/Dashboard/DashboardView
 */

import { DashboardGuard } from './dashboard-guard';
import { DashboardContent } from './dashboard-content';
import { JSX } from 'react';

export function DashboardView(): JSX.Element {
  return (
    <DashboardGuard>
      <DashboardContent />
    </DashboardGuard>
  );
}
