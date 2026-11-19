/**
 * M4 UI Fixes — Component Tests
 *
 * Covers StatusBadge code→FR label normalization (raw codes never leak
 * into the UI, existing French labels unchanged).
 *
 * @module Tests/M4/UiFixesComponents
 */

import {
  render,
  screen,
  renderHook,
  act,
  fireEvent,
} from '@testing-library/react';
import { createElement } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  useAlertsRead,
  useActiveAlerts,
  alertFingerprint,
} from '@/hooks/use-alerts';
import type { Alert } from '@mbongo/shared';

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-charges', () => ({
  useCharges: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-schedule', () => ({
  usePayments: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-transactions', () => ({
  useTransactions: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-exchange-rate', () => ({
  useExchangeRate: jest.fn(() => ({
    rate: 0.93,
    rateDate: '2026-11-16',
    source: 'live',
    isLoading: false,
  })),
}));

import {
  DisplayCurrencyProvider,
  useDisplayCurrency,
} from '@/components/providers/display-currency-provider';
import type { JSX } from 'react';

describe('StatusBadge', () => {
  it('renders French labels from raw codes', () => {
    render(createElement(StatusBadge, { status: 'DUE' }));
    expect(screen.getByText('Dû')).toBeTruthy();
  });

  it('accepts COMPLETED and renders Réalisé', () => {
    render(createElement(StatusBadge, { status: 'COMPLETED' }));
    expect(screen.getByText('Réalisé')).toBeTruthy();
  });

  it('keeps existing French labels unchanged (no break)', () => {
    render(createElement(StatusBadge, { status: 'Provisionnée' }));
    expect(screen.getByText('Provisionnée')).toBeTruthy();
  });
});

describe('useAlertsRead', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists read fingerprints and reloads them', () => {
    const { result } = renderHook(() => useAlertsRead());
    act(() => {
      result.current.markAllRead(['due-soon-p1|500|2026-11-20', 'fp-2']);
    });
    expect(result.current.readIds.has('due-soon-p1|500|2026-11-20')).toBe(true);

    // New hook instance (re-open) reads the persisted state.
    const { result: reloaded } = renderHook(() => useAlertsRead());
    expect(reloaded.current.readIds.has('fp-2')).toBe(true);
  });

  it('treats an unlisted fingerprint as unread (re-trigger returns the badge)', () => {
    const { result } = renderHook(() => useAlertsRead());
    act(() => {
      result.current.markAllRead(['due-soon-p1|500|2026-11-20']);
    });
    expect(result.current.readIds.has('overdraft-exceeded-a1|-700|')).toBe(
      false
    );
  });
});

describe('alertFingerprint', () => {
  it('combines id, amount and date so a value change re-triggers', () => {
    const alert = {
      id: 'overdraft-exceeded-a1',
      type: 'OVERDRAFT_EXCEEDED',
      severity: 'danger',
      title: 't',
      message: 'm',
      amount: -700,
    } as unknown as Alert;
    expect(alertFingerprint(alert)).toBe('overdraft-exceeded-a1|-700|');
  });
});

describe('DisplayCurrencyProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to EUR, persists the choice, and converts EUR → CHF', () => {
    let ctx: ReturnType<typeof useDisplayCurrency> | null = null;
    const Probe = (): JSX.Element => {
      ctx = useDisplayCurrency();
      return createElement('span');
    };
    render(createElement(DisplayCurrencyProvider, null, createElement(Probe)));

    expect(ctx!.displayCurrency).toBe('EUR');

    act(() => {
      ctx!.setDisplayCurrency('CHF');
    });

    expect(window.localStorage.getItem('mbongo.displayCurrency')).toBe('CHF');
    expect(ctx!.displayCurrency).toBe('CHF');
    // Rate 0.93 (CHF → EUR): 100 EUR ≈ 107.53 CHF (EUR / rate).
    expect(ctx!.convert(100)).toBe(107.53);
  });

  it('reads a persisted CHF selection back (reload parity)', () => {
    window.localStorage.setItem('mbongo.displayCurrency', 'CHF');
    let ctx: ReturnType<typeof useDisplayCurrency> | null = null;
    const Probe = (): JSX.Element => {
      ctx = useDisplayCurrency();
      return createElement('span');
    };
    render(createElement(DisplayCurrencyProvider, null, createElement(Probe)));

    expect(ctx!.displayCurrency).toBe('CHF');
  });
});

describe('useActiveAlerts', () => {
  it('computes alerts from the prefetched data (empty contract without data)', () => {
    const { result } = renderHook(() => useActiveAlerts());
    expect(result.current).toEqual([]);
  });
});
