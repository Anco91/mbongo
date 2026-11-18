'use client';

/**
 * Charges Error Boundary
 *
 * Declarative plumbing: any failure inside the charges segment renders
 * here, inside the app shell.
 *
 * @module App/Charges/Error
 */

import { JSX } from 'react';
import { RouteError } from '@/components/common/route-error';

export default function ChargesError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Erreur lors du chargement des charges"
      error={error}
      reset={reset}
    />
  );
}
