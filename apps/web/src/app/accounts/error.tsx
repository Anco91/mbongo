'use client';

/**
 * Accounts Error Boundary
 *
 * Declarative plumbing: any failure inside the accounts segment renders
 * here, inside the app shell.
 *
 * @module App/Accounts/Error
 */

import { JSX } from 'react';
import { RouteError } from '@/components/common/route-error';

export default function AccountsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <RouteError
      title="Erreur lors du chargement des comptes"
      error={error}
      reset={reset}
    />
  );
}
