/**
 * Échéancier Page
 *
 * Server Component rendering the ScheduleGuard (prefetch + hydration).
 * Shows the upcoming due dates of all charges plus the virtual card
 * billing entries, for the 60 next days.
 *
 * @module App/Dashboard/Schedule
 */

import { Suspense } from 'react';
import { ScheduleGuard } from '@/components/schedule/schedule-guard';
import { JSX } from 'react';

export default function EcheancierPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="p-4">
          <span>Chargement de l&apos;échéancier…</span>
        </div>
      }
    >
      <ScheduleGuard />
    </Suspense>
  );
}
