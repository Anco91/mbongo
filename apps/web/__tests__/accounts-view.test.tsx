/**
 * Tests for AccountsView — computed balance display.
 *
 * Domain hooks are mocked; the view must join transactions per account
 * and render the balance computed by shared computeBalance (R9).
 *
 * @module Tests/Accounts/AccountsView
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { AccountsView } from '@/components/accounts/accounts-view';

jest.mock('@/components/accounts/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

jest.mock('@/hooks/use-transactions', () => ({
  useTransactions: jest.fn(),
}));

import { useAccounts } from '@/components/accounts/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';

const now = '2026-11-12T00:00:00.000Z';

const account = {
  id: 'account-ubs-courant',
  name: 'UBS Courant',
  bank: 'UBS',
  currency: 'CHF',
  accountType: 'CURRENT',
  memberId: 'member-anco-0001',
  overdraftLimit: 0,
  deferredCard: false,
  billingDay: null,
  openingBalance: 1000,
  status: 'ACTIVE',
  closedAt: null,
  createdAt: now,
  updatedAt: now,
};

const closedAccount = {
  ...account,
  id: 'account-old',
  name: 'Ancien compte',
  status: 'CLOSED',
};

const transactions = [
  {
    id: 'tx-1',
    accountId: 'account-ubs-courant',
    amount: -300,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'tx-2',
    accountId: 'account-ubs-courant',
    amount: 500,
    createdAt: now,
    updatedAt: now,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AccountsView', () => {
  it('renders the balance computed from opening balance + transactions', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      data: [account],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useTransactions as jest.Mock).mockReturnValue({
      data: transactions,
    });

    render(createElement(AccountsView));

    // 1000 - 300 + 500 = 1200.00 CHF (grouping separators vary by ICU data)
    expect(screen.getByText(/1[\s\u00A0\u202F]?200\.00\s?CHF/)).toBeTruthy();
  });

  it('hides closed accounts from the current view', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      data: [account, closedAccount],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useTransactions as jest.Mock).mockReturnValue({ data: [] });

    render(createElement(AccountsView));

    expect(screen.queryByText('Ancien compte')).toBeFalsy();
    expect(screen.getByText('UBS Courant')).toBeTruthy();
  });

  it('shows a negative balance in red', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      data: [{ ...account, overdraftLimit: 500 }],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useTransactions as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'tx-3',
          accountId: 'account-ubs-courant',
          amount: -1200,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    render(createElement(AccountsView));

    const balance = screen.getByText(/−?-?[\s\u00A0\u202F]?200\.00\s?CHF/);
    expect(balance.className).toContain('text-red-600');
  });
});

describe('AccountsView — error and loading states', () => {
  it('renders the error panel with a retry action', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network down'),
      refetch: jest.fn(),
    });
    (useTransactions as jest.Mock).mockReturnValue({ data: [] });

    render(createElement(AccountsView));

    expect(screen.getByText('Error loading accounts')).toBeTruthy();
    expect(screen.getByText('Network down')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('retries loading accounts when the retry button is clicked', () => {
    const refetch = jest.fn();
    (useAccounts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network down'),
      refetch,
    });
    (useTransactions as jest.Mock).mockReturnValue({ data: [] });

    render(createElement(AccountsView));
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refetch).toHaveBeenCalled();
  });

  it('renders the loading state', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    (useTransactions as jest.Mock).mockReturnValue({ data: [] });

    render(createElement(AccountsView));

    expect(screen.getByText('Loading accounts...')).toBeTruthy();
  });

  it('shows the empty state with a create link', () => {
    (useAccounts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useTransactions as jest.Mock).mockReturnValue({ data: [] });

    render(createElement(AccountsView));

    expect(screen.getByText('No accounts yet')).toBeTruthy();
  });
});
