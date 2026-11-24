'use client';

/**
 * Unmatched Income Error Boundary
 *
 * @module App/Incomes/Unmatched/Error
 */

import { JSX } from 'react';
import { RouteError } from '@/components/patterns/route-error';

export default function UnmatchedIncomeError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Impossible de charger les revenus à lier"
      error={error}
      reset={reset}
    />
  );
}
