/**
 * Tests for AccountEditForm — the close mutation must finish before the
 * navigation back to the accounts list.
 *
 * @module Tests/Accounts/AccountEditForm
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { AccountEditForm } from '@/components/accounts/account-edit-form';

const push = jest.fn();
const closeAccount = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/hooks/use-accounts', () => ({
  useAccount: jest.fn(),
  useAccounts: jest.fn(),
  useUpdateAccount: jest.fn(),
  useCloseAccount: jest.fn(),
}));

jest.mock('@/hooks/use-members', () => ({
  useMembers: jest.fn(),
}));

import {
  useAccount,
  useAccounts,
  useUpdateAccount,
  useCloseAccount,
} from '@/hooks/use-accounts';
import { useMembers } from '@/hooks/use-members';

const account = {
  id: 'account-1',
  name: 'UBS Courant',
  bank: 'UBS',
  currency: 'CHF',
  accountType: 'CURRENT',
  memberId: null,
  overdraftLimit: 0,
  deferredCard: false,
  billingDay: null,
  linkedAccountId: null,
  openingBalance: 0,
  status: 'ACTIVE',
  closedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAccount as jest.Mock).mockReturnValue({
    data: account,
    isLoading: false,
  });
  (useAccounts as jest.Mock).mockReturnValue({ data: [] });
  (useMembers as jest.Mock).mockReturnValue({ data: [] });
  (useUpdateAccount as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
    isSuccess: false,
    error: null,
  });
  (useCloseAccount as jest.Mock).mockReturnValue({ mutateAsync: closeAccount });
});

describe('AccountEditForm', () => {
  it('navigates only after the close mutation settles', async () => {
    let resolveClose: () => void = () => undefined;
    closeAccount.mockReturnValue(
      new Promise<void>((done) => {
        resolveClose = done;
      })
    );

    render(createElement(AccountEditForm, { accountId: account.id }));

    fireEvent.click(screen.getByRole('button', { name: 'Clôturer le compte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clôturer' }));

    expect(closeAccount).toHaveBeenCalledWith(account.id);
    expect(push).not.toHaveBeenCalled();

    resolveClose();

    await waitFor(() => expect(push).toHaveBeenCalledWith('/accounts'));
  });

  it('stays on the page when the close mutation fails', async () => {
    closeAccount.mockRejectedValue(new Error('Clôture impossible.'));

    render(createElement(AccountEditForm, { accountId: account.id }));

    fireEvent.click(screen.getByRole('button', { name: 'Clôturer le compte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clôturer' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Clôture impossible.'
    );
    expect(push).not.toHaveBeenCalled();
  });
});
