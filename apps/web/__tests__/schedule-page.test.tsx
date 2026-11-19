/**
 * Tests for the schedule route shell — the page streams the shared list
 * skeleton instead of a one-off loading sentence.
 *
 * @module Tests/Schedule/SchedulePage
 */

import { Suspense, createElement } from 'react';
import EcheancierPage from '@/app/schedule/page';
import ScheduleLoading from '@/app/schedule/loading';

jest.mock('@/components/schedule/schedule-view', () => ({
  ScheduleView: () => createElement('div', null, 'vue'),
}));

describe('EcheancierPage', () => {
  it('uses the shared skeleton as its suspense fallback', () => {
    const page = EcheancierPage() as unknown as {
      type: unknown;
      props: { fallback: { type: unknown } };
    };

    expect(page.type).toBe(Suspense);
    expect(page.props.fallback.type).toBe(ScheduleLoading);
  });
});
