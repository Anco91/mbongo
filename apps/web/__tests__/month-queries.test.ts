/**
 * Tests for the windowed month queries (design D5) and the
 * `useMonthPayments` hook (task 2.1): stable key within a month,
 * month-derived due-date bounds, server/client shared query shape.
 *
 * @module Tests/Lib/MonthQueries
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactElement, type ReactNode } from 'react';
import {
  alertsPaymentsQuery,
  monthPaymentsQuery,
  monthTransactionsQuery,
} from '@/lib/month-queries';
import { useMonthPayments } from '@/hooks/use-schedule';
import { useMarkPaymentAsPaid } from '@/hooks/use-charges';

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

const payment = {
  id: 'p1',
  chargeId: 'c1',
  amount: 1850,
  currency: 'CHF',
  dueDate: '2026-11-05T00:00:00.000Z',
  status: 'PENDING',
  paidAt: null,
  transactionId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('monthPaymentsQuery', () => {
  it('derives stable dueDate bounds from the month key', () => {
    const query = monthPaymentsQuery('2026-11');
    expect(query.dueDate).toEqual({
      gte: new Date(2026, 10, 1).toISOString(),
      lte: new Date(2026, 10, 30, 23, 59, 59, 999).toISOString(),
    });
    expect(query.limit).toBe(500);
  });

  it('produces the same shape for the same key (stable query object)', () => {
    expect(monthPaymentsQuery('2026-11')).toEqual(
      monthPaymentsQuery('2026-11')
    );
  });
});

describe('monthTransactionsQuery', () => {
  it('derives dateFrom/dateTo from the month key', () => {
    expect(monthTransactionsQuery('2026-11')).toEqual({
      dateFrom: new Date(2026, 10, 1).toISOString(),
      dateTo: new Date(2026, 10, 30, 23, 59, 59, 999).toISOString(),
    });
  });
});

describe('alertsPaymentsQuery', () => {
  it('covers the overdue history and the D+30 forecast window', () => {
    const query = alertsPaymentsQuery('2026-11-24');
    expect(query.status).toEqual({ eq: 'PENDING' });
    expect(query.dueDate?.gte).toBeUndefined();
    // 2026-11-24 + 30 days → 2026-12-24, end of day.
    expect(query.dueDate?.lte).toBe(
      new Date(2026, 11, 24, 23, 59, 59, 999).toISOString()
    );
    expect(query.limit).toBe(500);
  });
});

describe('useMonthPayments', () => {
  beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
  });

  it('fetches the chosen month window and keeps a stable key across renders', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [payment], success: true })
    );
    const qc = new QueryClient();

    const { result, rerender } = renderHook(() => useMonthPayments('2026-11'), {
      wrapper: makeWrapper(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);

    rerender();
    rerender();

    // One network call only: the same month key reuses the same query.
    const paymentCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).startsWith('/api/payments')
    );
    expect(paymentCalls).toHaveLength(1);

    // Bounds of the chosen month travel in the query string.
    const [url] = paymentCalls[0] as [string];
    expect(url).toContain('dueDate%5Bgte%5D=');
    expect(url).toContain('dueDate%5Blte%5D=');
  });

  it('issues a new query when the month changes', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [payment], success: true })
    );
    const qc = new QueryClient();

    const { result, rerender } = renderHook(
      ({ monthKey }) => useMonthPayments(monthKey),
      {
        wrapper: makeWrapper(qc),
        initialProps: { monthKey: '2026-11' },
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    rerender({ monthKey: '2026-12' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The December window is its own cache entry under the shared prefix.
    const december = qc.getQueryState([
      'payments',
      monthPaymentsQuery('2026-12'),
    ]);
    expect(december?.status).toBe('success');

    const paymentCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).startsWith('/api/payments')
    );
    expect(paymentCalls.length).toBeGreaterThanOrEqual(2);
    expect(String(paymentCalls[1]?.[0])).not.toBe(String(paymentCalls[0]?.[0]));
  });
});

describe('useMarkPaymentAsPaid invalidation (task 2.3)', () => {
  it('invalidates every payments window via the shared prefix', async () => {
    global.fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockReset();
    // PATCH /api/payments/p1 — the mutation itself.
    fetchMock.mockResolvedValue(
      jsonResponse({ data: { ...payment, status: 'PAID' }, success: true })
    );

    const qc = new QueryClient();
    const windowQuery = monthPaymentsQuery('2026-11');
    qc.setQueryData(['payments', windowQuery], [payment]);

    const { result } = renderHook(() => useMarkPaymentAsPaid(), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate({ chargeId: 'c1', paymentId: 'p1' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(qc.getQueryState(['payments', windowQuery])?.isInvalidated).toBe(
      true
    );
  });
});
