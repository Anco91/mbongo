/**
 * Integration tests for the alerts badge (spec alerts — "Badge effacé
 * sans rechargement", "Redéclenchement").
 *
 * AppHeader and AlertsContent are mounted with the REAL (non-mocked)
 * read store and real data hooks; only the network layer (global fetch)
 * and next/navigation are mocked. The header badge must clear as soon
 * as the dedicated view marks the alerts read, without a reload, and
 * reappear when a condition re-triggers with a moved value.
 *
 * @module Tests/Alerts/AlertsBadgeIntegration
 */
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactElement } from 'react';
import { AppHeader } from '@/components/patterns/app-header';
import { AlertsContent } from '@/components/alerts/alerts-content';
import { DisplayCurrencyProvider } from '@/components/providers/display-currency-provider';
import { ALERTS_READ_KEY } from '@/lib/alerts-read-store';

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

const fetchMock = jest.fn();

const jsonResponse = (
  body: unknown
): {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
} => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: () => Promise.resolve(body),
});

/** Account inside the overdraft-approach band (≤ −70 % of the limit). */
function overdrawnAccount(
  id: string,
  openingBalance: number
): Record<string, unknown> {
  return {
    id,
    name: `Compte ${id}`,
    bank: 'UBS',
    currency: 'EUR',
    accountType: 'CURRENT',
    memberId: null,
    overdraftLimit: 500,
    deferredCard: false,
    billingDay: null,
    openingBalance,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };
}

function mockNetwork(account: Record<string, unknown>): void {
  fetchMock.mockImplementation((url: string) => {
    if (url.startsWith('/api/accounts')) {
      return Promise.resolve(jsonResponse({ data: [account], success: true }));
    }
    // payments / transactions / charges — no other alert condition.
    return Promise.resolve(jsonResponse({ data: [], success: true }));
  });
}

type Screen = 'header' | 'alerts';

function view(screen: Screen): ReactElement {
  return createElement(
    DisplayCurrencyProvider,
    null,
    screen === 'header'
      ? createElement(AppHeader)
      : createElement(AlertsContent)
  );
}

beforeEach(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
  window.localStorage.clear();
});

describe('alerts badge integration (real store)', () => {
  it('clears the bell badge without a reload once the view marks alerts read', async () => {
    mockNetwork(overdrawnAccount('acc-badge-1', -380));
    const qc = new QueryClient();
    const { rerender } = render(
      createElement(QueryClientProvider, { client: qc }, view('header'))
    );

    // GIVEN 1 active unread alert — the header badge shows it.
    await waitFor(() =>
      expect(screen.getByLabelText('Alertes (1 non lues)')).toBeTruthy()
    );

    // WHEN the dedicated view is opened — it marks the alert read.
    rerender(
      createElement(QueryClientProvider, { client: qc }, view('alerts'))
    );
    await waitFor(() =>
      expect(window.localStorage.getItem(ALERTS_READ_KEY)).toContain(
        'overdraft-approach-acc-badge-1|-380|'
      )
    );

    // THEN back on the dashboard, the badge is gone without any reload.
    rerender(
      createElement(QueryClientProvider, { client: qc }, view('header'))
    );
    await waitFor(() => expect(screen.getByLabelText('Alertes')).toBeTruthy());
    expect(screen.queryByLabelText('Alertes (1 non lues)')).toBeNull();
  });

  it('brings the badge back when the condition re-triggers with a moved value', async () => {
    mockNetwork(overdrawnAccount('acc-badge-2', -380));
    const qc = new QueryClient();
    const { rerender } = render(
      createElement(QueryClientProvider, { client: qc }, view('header'))
    );

    // GIVEN a read alert (view opened once).
    await waitFor(() =>
      expect(screen.getByLabelText('Alertes (1 non lues)')).toBeTruthy()
    );
    rerender(
      createElement(QueryClientProvider, { client: qc }, view('alerts'))
    );
    await waitFor(() =>
      expect(window.localStorage.getItem(ALERTS_READ_KEY)).toContain(
        'overdraft-approach-acc-badge-2|-380|'
      )
    );
    rerender(
      createElement(QueryClientProvider, { client: qc }, view('header'))
    );
    await waitFor(() => expect(screen.getByLabelText('Alertes')).toBeTruthy());

    // WHEN the condition re-triggers with a moved value (−380 → −420).
    mockNetwork(overdrawnAccount('acc-badge-2', -420));
    await qc.invalidateQueries({ queryKey: ['accounts'] });

    // THEN the alert counts as unread again — the badge is back.
    await waitFor(() =>
      expect(screen.getByLabelText('Alertes (1 non lues)')).toBeTruthy()
    );
  });
});
