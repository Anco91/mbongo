/**
 * Tests for AppHeader — bell badge and display-currency selector.
 *
 * All data hooks are mocked; the header contract: the bell shows the
 * count of active unread alerts and links to /alerts, and the selector
 * is driven by the shared display-currency context.
 *
 * @module Tests/Common/AppHeader
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { AppHeader } from '@/components/patterns/app-header';
import { DisplayCurrencyProvider } from '@/components/providers/display-currency-provider';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('@/hooks/use-exchange-rate', () => ({
  useExchangeRate: jest.fn(() => ({
    rate: null,
    rateDate: null,
    source: 'none',
    isLoading: false,
  })),
}));

jest.mock('@/hooks/use-alerts', () => ({
  useActiveAlerts: jest.fn(),
  useAlertsRead: jest.fn(),
  alertFingerprint: jest.fn((a: { id: string }) => a.id),
}));

import { useActiveAlerts, useAlertsRead } from '@/hooks/use-alerts';
import { usePathname } from 'next/navigation';

const renderHeader = (): void => {
  render(
    createElement(DisplayCurrencyProvider, null, createElement(AppHeader))
  );
};

describe('AppHeader', () => {
  it('shows the unread count badge with active alerts', () => {
    (useActiveAlerts as jest.Mock).mockReturnValue([
      { id: 'a1' },
      { id: 'a2' },
      { id: 'a3' },
    ]);
    (useAlertsRead as jest.Mock).mockReturnValue({
      readIds: new Set<string>(),
      markAllRead: jest.fn(),
    });

    renderHeader();

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByLabelText('Alertes (3 non lues)')).toBeTruthy();
  });

  it('hides the badge when all alerts are read', () => {
    (useActiveAlerts as jest.Mock).mockReturnValue([
      { id: 'a1' },
      { id: 'a2' },
    ]);
    (useAlertsRead as jest.Mock).mockReturnValue({
      readIds: new Set<string>(['a1', 'a2']),
      markAllRead: jest.fn(),
    });

    renderHeader();

    expect(screen.queryByText('2')).toBeNull();
    expect(screen.getByLabelText('Alertes')).toBeTruthy();
  });

  it('renders the shared display-currency selector', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    (useActiveAlerts as jest.Mock).mockReturnValue([]);
    (useAlertsRead as jest.Mock).mockReturnValue({
      readIds: new Set<string>(),
      markAllRead: jest.fn(),
    });

    renderHeader();

    expect(screen.getByText('EUR')).toBeTruthy();
    expect(screen.getByText('CHF')).toBeTruthy();
  });

  it('masque le sélecteur hors dashboard (revue M4)', () => {
    (usePathname as jest.Mock).mockReturnValue('/charges');
    (useActiveAlerts as jest.Mock).mockReturnValue([]);
    (useAlertsRead as jest.Mock).mockReturnValue({
      readIds: new Set<string>(),
      markAllRead: jest.fn(),
    });

    renderHeader();

    expect(screen.queryByText('EUR')).toBeNull();
    expect(screen.queryByText('CHF')).toBeNull();
    expect(screen.getByText('Charges & échéancier')).toBeTruthy();
  });
});
