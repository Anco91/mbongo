'use client';

/**
 * Dashboard Error Boundary
 *
 * Declarative plumbing: any failure inside the dashboard segment renders
 * here, inside the app shell.
 *
 * @module App/Error
 */

import { JSX } from 'react';
import { RouteError } from '@/components/common/route-error';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Erreur lors du chargement du tableau de bord"
      error={error}
      reset={reset}
    />
  );
}
