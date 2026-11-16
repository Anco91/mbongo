/**
 * Schedule View Component
 *
 * Composition shell: page → View → Guard (children) → Content.
 * The Guard prefetches via the server-side service (R5) and renders
 * the client Content inside the hydration boundary.
 *
 * @module Components/Schedule/ScheduleView
 */

import { ScheduleGuard } from './schedule-guard';
import { ScheduleContent } from './schedule-content';
import { JSX } from 'react';

export function ScheduleView(): JSX.Element {
  return (
    <ScheduleGuard>
      <ScheduleContent />
    </ScheduleGuard>
  );
}
