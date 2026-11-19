/**
 * Tests for the skeleton primitives — placeholders keep the layout and
 * stay inert for assistive technology.
 *
 * @module Tests/UI/Skeleton
 */

import { render } from '@testing-library/react';
import { createElement } from 'react';
import {
  SkeletonCard,
  SkeletonLine,
  SkeletonList,
} from '@/components/ui/skeleton';

describe('skeleton primitives', () => {
  it('renders a card with the requested number of lines', () => {
    render(createElement(SkeletonCard, { lines: 4 }));

    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(5);
  });

  it('renders one row per expected list item', () => {
    render(createElement(SkeletonList, { rows: 3 }));

    const rows = document.querySelectorAll('.divide-y > div');
    expect(rows).toHaveLength(3);
  });

  it('stays hidden from assistive technology', () => {
    render(createElement(SkeletonLine));

    expect(document.querySelector('[aria-hidden]')).toBeTruthy();
  });
});
