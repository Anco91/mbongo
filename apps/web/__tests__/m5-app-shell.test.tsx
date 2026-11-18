/**
 * Tests for the M5 app shell — layout height, single scroll container,
 * tab bar visibility, safe areas (design D1-D4).
 *
 * @module Tests/M5/AppShell
 */

import { render } from '@testing-library/react';
import { createElement } from 'react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: jest.fn(() => '/charges'),
}));

jest.mock('@/hooks/use-alerts', () => ({
  useActiveAlerts: jest.fn(() => []),
  useAlertsRead: jest.fn(() => ({
    readIds: new Set<string>(),
    markAllRead: jest.fn(),
  })),
  alertFingerprint: jest.fn((a: { id: string }) => a.id),
}));

jest.mock('@/hooks/use-exchange-rate', () => ({
  useExchangeRate: jest.fn(() => ({
    rate: null,
    rateDate: null,
    source: 'none',
    isLoading: false,
  })),
}));

import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/common/app-shell';
import { DisplayCurrencyProvider } from '@/components/providers/display-currency-provider';

const renderShell = (): ReturnType<typeof render> =>
  render(
    createElement(
      DisplayCurrencyProvider,
      null,
      createElement(AppShell, null, createElement('p', null, 'contenu'))
    )
  );

describe('App shell', () => {
  it('bounds the shell to the viewport and scrolls only the main area', () => {
    const { container } = renderShell();

    const shell = container.querySelector('main')?.parentElement;
    expect(shell?.className).toContain('h-full');
    expect(shell?.className).toContain('overflow-hidden');

    const main = container.querySelector('main');
    expect(main?.className).toContain('min-h-0');
    expect(main?.className).toContain('flex-1');
    expect(main?.className).toContain('overflow-y-auto');
  });

  it('keeps the tab bar inside the shell, after the main area', () => {
    const { container } = renderShell();

    const children = Array.from(
      container.querySelector('main')?.parentElement?.children ?? []
    );
    const mainIndex = children.findIndex((el) => el.tagName === 'MAIN');
    const navIndex = children.findIndex((el) => el.tagName === 'NAV');

    expect(mainIndex).toBeGreaterThanOrEqual(0);
    expect(navIndex).toBeGreaterThan(mainIndex);
  });

  it('applies safe-area padding to the shell edges', () => {
    const { container } = renderShell();

    const header = container.querySelector('main')?.previousElementSibling;
    const nav = container.querySelector('nav');

    expect(header?.className).toContain('safe-area-inset-top');
    expect(nav?.className).toContain('shrink-0');
    expect(nav?.className).toContain('safe-area-inset-bottom');
  });

  it('hides the tab bar on an edit sub-view', () => {
    (usePathname as jest.Mock).mockReturnValue('/charges/abc/edit');

    const { container } = renderShell();

    expect(container.querySelector('nav')).toBeNull();
  });
});
