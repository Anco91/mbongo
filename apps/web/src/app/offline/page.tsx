/**
 * Offline fallback — static page served by the service worker when a
 * navigation fails and no cached document exists. No data fetching.
 *
 * @module App/Offline
 */

import Link from 'next/link';
import { JSX } from 'react';

export default function OfflinePage(): JSX.Element {
  return (
    <div className="flex flex-col items-start gap-3 py-10">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">
        Hors ligne
      </p>
      <h1 className="text-lg font-semibold tracking-tight text-slate-900">
        Pas de connexion
      </h1>
      <p className="text-sm text-slate-600">
        Les données financières ne sont pas mises en cache. Reconnectez-vous
        pour retrouver vos charges, comptes et transferts.
      </p>
      <Link
        href="/"
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
      >
        Réessayer
      </Link>
    </div>
  );
}
