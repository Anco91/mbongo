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
import { ScheduleView } from '@/components/schedule/schedule-view';
import ScheduleLoading from '@/app/schedule/loading';
import { JSX } from 'react';

export default function EcheancierPage(): JSX.Element {
  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleView />
    </Suspense>
  );
}
