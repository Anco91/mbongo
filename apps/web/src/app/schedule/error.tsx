'use client';

/**
 * Schedule Error Boundary
 *
 * Declarative plumbing: any failure inside the schedule segment renders
 * here, inside the app shell.
 *
 * @module App/Schedule/Error
 */

import { JSX } from 'react';
import { RouteError } from '@/components/common/route-error';

export default function ScheduleError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Erreur lors du chargement de l'échéancier"
      error={error}
      reset={reset}
    />
  );
}
