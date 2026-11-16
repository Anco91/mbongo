/**
 * Alerts Content Component
 *
 * Dedicated alerts view (replaces the dashboard banner): every active
 * alert, sorted by severity (strongest first), with an empty state.
 * Opening the view marks the current alerts as read on this device, so
 * the header badge clears until a condition re-triggers.
 *
 * @module Components/Alerts/AlertsContent
 */

'use client';

import { useEffect, type JSX } from 'react';
import {
  useActiveAlerts,
  useAlertsRead,
  alertFingerprint,
} from '@/hooks/use-alerts';
import { AlertCard } from '@/components/alerts/alert-card';

export function AlertsContent(): JSX.Element {
  const alerts = useActiveAlerts();
  const { markAllRead } = useAlertsRead();

  // Opening the view marks every current alert as read (per device).
  useEffect(() => {
    if (alerts.length > 0) {
      markAllRead(alerts.map(alertFingerprint));
    }
  }, [alerts, markAllRead]);

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 p-8 text-center">
        <h3 className="mb-2 text-base font-semibold text-slate-800">
          Aucune alerte
        </h3>
        <p className="text-sm text-slate-600">
          Aucune condition d&apos;alerte n&apos;est déclenchée pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
