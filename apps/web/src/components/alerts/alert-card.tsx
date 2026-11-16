/**
 * Alert Card — one reusable renderer for a financial alert.
 *
 * Severity styling lives here (single source), so any surface that lists
 * alerts (dedicated view now, other surfaces later) stays consistent.
 *
 * @module Components/Alerts/AlertCard
 */

import type { Alert, AlertSeverity } from '@mbongo/shared';
import { type JSX } from 'react';

const severityStyles: Record<AlertSeverity, string> = {
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const severityLabels: Record<AlertSeverity, string> = {
  danger: 'Critique',
  warning: 'Avertissement',
  info: 'Info',
};

export function AlertCard({ alert }: { alert: Alert }): JSX.Element {
  return (
    <div
      className={`rounded-lg border px-3.5 py-2.5 text-xs ${severityStyles[alert.severity]}`}
    >
      <div className="flex items-center justify-between font-semibold">
        <span>{alert.title}</span>
        <span className="uppercase text-[10px] tracking-wider opacity-75">
          {severityLabels[alert.severity]}
        </span>
      </div>
      <p className="mt-0.5 text-slate-600">{alert.message}</p>
    </div>
  );
}
