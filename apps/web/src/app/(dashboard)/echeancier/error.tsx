'use client';

/**
 * Schedule Error Boundary
 *
 * Declarative plumbing: any failure inside the échéancier segment renders
 * here.
 *
 * @module App/Dashboard/Schedule/Error
 */

import { JSX } from 'react';

export default function EcheancierError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): JSX.Element {
  return (
    <div className="p-4 border border-red-300 rounded-lg bg-red-50">
      <h3 className="font-semibold text-red-700 mb-2">
        Erreur lors du chargement de l&apos;échéancier
      </h3>
      <p className="text-red-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
