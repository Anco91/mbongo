/**
 * Alerts Page (dedicated alerts view)
 *
 * Server Component rendering the AlertsGuard (prefetch + hydration).
 *
 * @module App/Alerts
 */

import { AlertsView } from '@/components/alerts/alerts-view';
import { JSX } from 'react';

export default function AlertsPage(): JSX.Element {
  return <AlertsView />;
}
