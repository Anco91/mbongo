/**
 * Tests for the accounts, members and transactions domain hooks.
 *
 * Hooks are rendered with renderHook under a fresh QueryClient; the
 * repositories' network layer (global fetch) is mocked.
 *
 * @module Tests/Hooks
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactElement, type ReactNode } from 'react';
import {
  useAccounts,
  useAccount,
  useCreateAccount,
  useUpdateAccount,
  useCloseAccount,
} from '@/components/accounts/hooks/use-accounts';
import { useMembers } from '@/components/members/hooks/use-members';
import { useTransactions } from '@/hooks/use-transactions';

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

const account = {
  id: 'account-ubs-courant',
  name: 'UBS Courant',
  currency: 'CHF',
  accountType: 'CURRENT',
  memberId: 'member-anco-0001',
  overdraftLimit: 0,
  deferredCard: false,
  billingDay: null,
  openingBalance: 0,
  status: 'ACTIVE',
  closedAt: null,
  createdAt: now,
  updatedAt: now,
};

const transaction = {
  id: 'tx-1',
  accountId: 'account-ubs-courant',
  date: '2026-11-12',
  amount: -42.5,
  category: null,
  note: null,
  transferId: null,
  transferRole: null,
  createdAt: now,
  updatedAt: now,
};

beforeEach(() => {
  global.fetch = fetchMock as unknown as typeof fetch;
  fetchMock.mockReset();
});

describe('useAccounts', () => {
  it('loads and parses accounts', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [account], success: true })
    );
    const qc = new QueryClient();

    const { result } = renderHook(() => useAccounts(), {
      wrapper: makeWrapper(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].name).toBe('UBS Courant');
  });
});

describe('useCreateAccount', () => {
  it('creates an account and invalidates the list', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ data: account, success: true }, 201)
      )
      .mockResolvedValueOnce(jsonResponse({ data: [account], success: true }));
    const qc = new QueryClient();

    const { result } = renderHook(() => useCreateAccount(), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate({
      name: 'UBS Courant',
      currency: 'CHF',
      accountType: 'CURRENT',
      memberId: 'member-anco-0001',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/accounts');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toMatchObject({
      name: 'UBS Courant',
    });
  });
});

describe('useMembers', () => {
  it('loads household members', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        data: [
          {
            id: 'member-anco-0001',
            firstName: 'Anco',
            role: 'PRIMARY',
            createdAt: now,
            updatedAt: now,
          },
        ],
        success: true,
      })
    );
    const qc = new QueryClient();

    const { result } = renderHook(() => useMembers(), {
      wrapper: makeWrapper(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].firstName).toBe('Anco');
  });
});

describe('useTransactions', () => {
  it('loads transactions', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ data: [transaction], success: true })
    );
    const qc = new QueryClient();

    const { result } = renderHook(() => useTransactions(), {
      wrapper: makeWrapper(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].amount).toBe(-42.5);
  });
});

describe('useAccount', () => {
  it('loads a single account by id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: account, success: true }));
    const qc = new QueryClient();

    const { result } = renderHook(() => useAccount('account-ubs-courant'), {
      wrapper: makeWrapper(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('account-ubs-courant');
  });
});

describe('useUpdateAccount', () => {
  it('patches the account and refreshes the cache', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: account, success: true }));
    const qc = new QueryClient();

    const { result } = renderHook(() => useUpdateAccount(), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate({ id: 'account-ubs-courant', input: { name: 'X' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/accounts/account-ubs-courant');
    expect(init.method).toBe('PATCH');
  });
});

describe('useCloseAccount', () => {
  it('posts to the close endpoint', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: account, success: true }));
    const qc = new QueryClient();

    const { result } = renderHook(() => useCloseAccount(), {
      wrapper: makeWrapper(qc),
    });

    result.current.mutate('account-ubs-courant');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/accounts/account-ubs-courant/close');
    expect(init.method).toBe('POST');
  });
});
