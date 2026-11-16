/**
 * Alerts View Component
 *
 * Composition shell: page → View → Guard (children) → Content.
 *
 * @module Components/Alerts/AlertsView
 */

import { AlertsGuard } from './alerts-guard';
import { AlertsContent } from './alerts-content';
import { JSX } from 'react';

export function AlertsView(): JSX.Element {
  return (
    <AlertsGuard>
      <AlertsContent />
    </AlertsGuard>
  );
}
