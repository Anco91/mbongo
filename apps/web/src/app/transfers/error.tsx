'use client';

/**
 * Transfers Error Boundary
 *
 * Declarative plumbing: any failure inside the transfers segment renders
 * here, inside the app shell.
 *
 * @module App/Transfers/Error
 */

import { JSX } from 'react';
import { RouteError } from '@/components/patterns/route-error';

export default function TransfersError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Impossible de charger les transferts"
      error={error}
      reset={reset}
    />
  );
}
