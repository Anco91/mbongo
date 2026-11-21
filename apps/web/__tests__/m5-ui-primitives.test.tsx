/**
 * Tests for the shared UI primitives introduced in M5 — member filter chips
 * and the async loading/error states (design D7).
 *
 * @module Tests/M5/UiPrimitives
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import type { Member } from '@mbongo/shared';
import { MemberFilterChips } from '@/components/patterns/member-filter-chips';
import { ErrorPanel, LoadingState } from '@/components/patterns/async-state';

const members: Member[] = [
  {
    id: 'm1',
    firstName: 'Anco',
    lastName: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'm2',
    firstName: 'Léa',
    lastName: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('MemberFilterChips', () => {
  it('renders all members plus the "all" choice', () => {
    render(
      createElement(MemberFilterChips, {
        members,
        value: 'all',
        onChange: jest.fn(),
      })
    );

    expect(screen.getByText('Tous les membres')).toBeTruthy();
    expect(screen.getByText('Anco')).toBeTruthy();
    expect(screen.getByText('Léa')).toBeTruthy();
  });

  it('reports the selected member id', () => {
    const onChange = jest.fn();
    render(
      createElement(MemberFilterChips, { members, value: 'all', onChange })
    );

    fireEvent.click(screen.getByText('Léa'));

    expect(onChange).toHaveBeenCalledWith('m2');
  });

  it('renders nothing without members', () => {
    const { container } = render(
      createElement(MemberFilterChips, {
        members: [],
        value: 'all',
        onChange: jest.fn(),
      })
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('Async state primitives', () => {
  it('shows the default loading label', () => {
    render(createElement(LoadingState));

    expect(screen.getByRole('status').textContent).toBe('Chargement…');
  });

  it('shows a custom loading label', () => {
    render(createElement(LoadingState, { label: 'Chargement des comptes…' }));

    expect(screen.getByText('Chargement des comptes…')).toBeTruthy();
  });

  it('shows the error title, message and retry action', () => {
    const onRetry = jest.fn();
    render(
      createElement(ErrorPanel, {
        title: 'Erreur lors du chargement',
        message: 'Réseau indisponible',
        onRetry,
      })
    );

    expect(screen.getByText('Erreur lors du chargement')).toBeTruthy();
    expect(screen.getByText('Réseau indisponible')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(onRetry).toHaveBeenCalled();
  });
});
