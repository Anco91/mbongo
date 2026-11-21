'use client';

/**
 * Alerts Error Boundary
 *
 * Declarative plumbing: any failure inside the alerts segment renders
 * here, inside the app shell.
 *
 * @module App/Alerts/Error
 */

import { JSX } from 'react';
import { RouteError } from '@/components/patterns/route-error';

export default function AlertsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Impossible de charger les alertes"
      error={error}
      reset={reset}
    />
  );
}
