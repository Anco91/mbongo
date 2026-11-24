/**
 * Tests for the windowed `useActiveAlerts` (task 5.1, design D5): the
 * payments query covers overdue history plus the D+30 forecast window,
 * and its key is stable within the day (no churn between renders).
 *
 * @module Tests/Hooks/UseActiveAlerts
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { addDays, format, subDays } from 'date-fns';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { useActiveAlerts } from '@/hooks/use-alerts';

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

function makeWrapper(
  qc: QueryClient
): (props: { children: ReactNode }) => ReactElement {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

const now = new Date();

const account = {
  id: 'acc-ovd',
  name: 'UBS Courant',
  bank: 'UBS',
  currency: 'EUR',
  accountType: 'CURRENT',
  memberId: null,
  overdraftLimit: 500,
  deferredCard: false,
  billingDay: null,
  openingBalance: -400,
  status: 'ACTIVE',
  closedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const charge = {
  id: 'c-rent',
  label: 'Loyer GE',
  type: 'FIXED_RECURRING',
  amount: 1850,
  currency: 'EUR',
  accountId: 'acc-ovd',
  category: 'Logement',
  startDate: '2026-01-01',
  endDate: null,
  frequency: 'monthly',
  installments: null,
  provisioned: false,
  dueDay: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function paymentFixture(id: string, dueDate: string): Record<string, unknown> {
  return {
    id,
    chargeId: 'c-rent',
    amount: 1850,
    currency: 'EUR',
    dueDate,
    status: 'PENDING',
    paidAt: null,
    transactionId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

beforeEach(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
  fetchMock.mockImplementation((url: string) => {
    if (url.startsWith('/api/charges')) {
      return Promise.resolve(jsonResponse({ data: [charge], success: true }));
    }
    if (url.startsWith('/api/payments')) {
      return Promise.resolve(
        jsonResponse({
          data: [
            // Overdue: before today — must stay covered (no lower bound).
            paymentFixture(
              'p-overdue',
              `${format(subDays(now, 5), 'yyyy-MM-dd')}T00:00:00.000Z`
            ),
            // In 10 days: inside the 30-day forecast window.
            paymentFixture(
              'p-forecast',
              `${format(addDays(now, 10), 'yyyy-MM-dd')}T00:00:00.000Z`
            ),
          ],
          success: true,
        })
      );
    }
    if (url.startsWith('/api/accounts')) {
      return Promise.resolve(jsonResponse({ data: [account], success: true }));
    }
    return Promise.resolve(jsonResponse({ data: [], success: true }));
  });
});

describe('useActiveAlerts (windowed)', () => {
  it('covers overdue payments and the 30-day forecast', async () => {
    const { result } = renderHook(() => useActiveAlerts(), {
      wrapper: makeWrapper(new QueryClient()),
    });

    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));

    const overdue = result.current.find((a) =>
      a.id.startsWith('overdue-p-overdue')
    );
    expect(overdue).toBeDefined();
    expect(overdue?.message).toContain('en retard');

    // Forecast: −400 − 1850 − 1850 < −500 → NEGATIVE_FORECAST for the account.
    const forecast = result.current.find((a) => a.type === 'NEGATIVE_FORECAST');
    expect(forecast).toBeDefined();
  });

  it('keeps a stable query key within the day (single fetch across renders)', async () => {
    const { rerender } = renderHook(() => useActiveAlerts(), {
      wrapper: makeWrapper(new QueryClient()),
    });

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).startsWith('/api/payments')
        )
      ).toBe(true)
    );

    rerender();
    rerender();

    const paymentCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).startsWith('/api/payments')
    );
    expect(paymentCalls).toHaveLength(1);

    // The upper bound is today + 30 days (stable within the day).
    const [url] = paymentCalls[0] as [string];
    expect(url).toContain('status%5Beq%5D=PENDING');
    expect(url).toContain('dueDate%5Blte%5D=');
    expect(url).not.toContain('dueDate%5Bgte%5D=');
  });
});
