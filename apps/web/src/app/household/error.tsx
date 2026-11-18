'use client';

/**
 * Household Error Boundary
 *
 * Declarative plumbing: any failure inside the household segment renders
 * here, inside the app shell.
 *
 * @module App/Household/Error
 */

import { JSX } from 'react';
import { RouteError } from '@/components/common/route-error';

export default function HouseholdError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Erreur lors du chargement du foyer"
      error={error}
      reset={reset}
    />
  );
}
