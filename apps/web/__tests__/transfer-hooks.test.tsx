/**
 * Tests for the transfers domain hooks.
 *
 * Hooks are rendered with renderHook under a fresh QueryClient; the
 * repositories' network layer (global fetch) is stubbed by hand because
 * jsdom does not ship fetch globals.
 *
 * @module Tests/Transfers/Hooks
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactElement, type ReactNode } from 'react';
import {
  useTransfers,
  useCreateTransfer,
  useCompleteTransfer,
} from '@/components/transfers/hooks/use-transfers';

const fetchMock = jest.fn();

/** Minimal Response stub — jsdom does not ship fetch globals. */
const jsonResponse = (
  body: unknown,
  status = 200
): {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
} => ({
  ok: status < 400,
  status,
  statusText: String(status),
  json: () => Promise.resolve(body),
});

function makeWrapper(
  qc: QueryClient
): (props: { children: ReactNode }) => ReactElement {
  function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return createElement(QueryClientProvider, { client: qc }, children);
  }
  return Wrapper;
}

const now = '2026-11-12T00:00:00.000Z';

const transfer = {
  id: 'transfer-1',
  sourceAccountId: 'account-ubs-courant',
  targetAccountId: 'account-bnp-perso',
  amountSent: 1500,
  rateEstimated: 1.0634,
  rateDate: '2026-11-12',
  amountReceived: null,
  rateEffective: null,
  fees: null,
  memo: null,
  status: 'ESTIMATED',
  sentAt: '2026-11-12',
  receivedAt: null,
  createdAt: now,
  updatedAt: now,
};

const completed = {
  ...transfer,
  status: 'COMPLETED',
  amountReceived: 1403.6,
  rateEffective: 0.93573,
  fees: 191.5,
  receivedAt: '2026-11-13',
};

beforeEach(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
});

describe('useTransfers', () => {
  it('loads and parses transfers', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [transfer], success: true })
    );
    const qc = new QueryClient();

    const { result } = renderHook(() => useTransfers(), {
      wrapper: makeWrapper(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].status).toBe('ESTIMATED');
  });
});

describe('useCreateTransfer', () => {
  it('posts the phase-1 payload to /api/transfers', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: transfer, success: true }, 201)
    );
    const qc = new QueryClient();

    const { result } = renderHook(() => useCreateTransfer(), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate({
      sourceAccountId: 'account-ubs-courant',
      targetAccountId: 'account-bnp-perso',
      amountSent: 1500,
      rateEstimated: 1.0634,
      rateDate: '2026-11-12',
      sentAt: '2026-11-12',
      memo: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/transfers');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toMatchObject({ amountSent: 1500 });
    expect(result.current.data?.status).toBe('ESTIMATED');
  });
});

describe('useCompleteTransfer', () => {
  it('patches the phase-2 payload to /api/transfers/{id}', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: completed, success: true })
    );
    const qc = new QueryClient();

    const { result } = renderHook(() => useCompleteTransfer(), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate({
      id: 'transfer-1',
      input: { amountReceived: 1403.6, receivedAt: '2026-11-13' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/transfers/transfer-1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({
      amountReceived: 1403.6,
      receivedAt: '2026-11-13',
    });
    expect(result.current.data?.status).toBe('COMPLETED');
  });

  it('surfaces the 409 already-completed rejection', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: 'CONFLICT', message: 'Transfer already completed' } },
        409
      )
    );
    const qc = new QueryClient();

    const { result } = renderHook(() => useCompleteTransfer(), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate({
      id: 'transfer-1',
      input: { amountReceived: 100, receivedAt: '2026-11-13' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
