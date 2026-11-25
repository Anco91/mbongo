'use client';

/**
 * Import Error Boundary
 *
 * @module App/Import/Error
 */

import { JSX } from 'react';
import { RouteError } from '@/components/patterns/route-error';

export default function ImportError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Impossible de charger l'import"
      error={error}
      reset={reset}
    />
  );
}
