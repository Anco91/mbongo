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
import { RouteError } from '@/components/common/route-error';

export default function TransfersError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Erreur lors du chargement des transferts"
      error={error}
      reset={reset}
    />
  );
}
