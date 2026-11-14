/**
 * Tests for AccountCreateForm — RHF submission gating.
 *
 * A valid submission reaches the mutation; an invalid one (missing name,
 * empty payload) is blocked by the shared zod schema before any request.
 *
 * @module Tests/Accounts/AccountCreateForm
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { AccountCreateForm } from '@/components/accounts/account-create-form';

jest.mock('@/components/accounts/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
  useAccount: jest.fn(),
  useCreateAccount: jest.fn(),
}));

jest.mock('@/components/members/hooks/use-members', () => ({
  useMembers: jest.fn(),
}));

import {
  useAccounts,
  useCreateAccount,
} from '@/components/accounts/hooks/use-accounts';
import { useMembers } from '@/components/members/hooks/use-members';

const mockMutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMembers as jest.Mock).mockReturnValue({ data: [] });
  (useAccounts as jest.Mock).mockReturnValue({ data: [] });
  (useCreateAccount as jest.Mock).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    error: null,
  });
});

describe('AccountCreateForm', () => {
  it('blocks an empty submission through zod (no request sent)', () => {
    render(createElement(AccountCreateForm));

    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits a valid account through useCreateAccount', async () => {
    render(createElement(AccountCreateForm));

    fireEvent.change(screen.getByLabelText('Nom du compte'), {
      target: { value: 'UBS Courant' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'UBS Courant',
        currency: 'CHF',
        accountType: 'CURRENT',
      })
    );
  });

  it('lists the household members in the owner selector', () => {
    (useMembers as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'member-anco-0001',
          firstName: 'Anco',
          role: 'PRIMARY',
          createdAt: '2026-11-12T00:00:00.000Z',
          updatedAt: '2026-11-12T00:00:00.000Z',
        },
      ],
    });

    render(createElement(AccountCreateForm));

    expect(
      screen.getAllByRole('option', { name: 'Anco' }).length
    ).toBeGreaterThan(0);
  });

  it('asks for an overdraft limit for EUR accounts (no overdraft in CHF)', () => {
    render(createElement(AccountCreateForm));

    // CHF default: no overdraft input, warning shown instead
    expect(screen.queryByLabelText(/Découvert autorisé/)).toBeFalsy();
    expect(
      screen.getByText(/Pas de découvert autorisé en Suisse/)
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Devise'), {
      target: { value: 'EUR' },
    });

    expect(screen.getByLabelText(/Découvert autorisé/)).toBeTruthy();
    expect(
      screen.queryByText(/Pas de découvert autorisé en Suisse/)
    ).toBeFalsy();
  });

  it('asks for the billing day for CREDIT_CARD accounts', () => {
    render(createElement(AccountCreateForm));

    expect(screen.queryByLabelText(/Jour de facturation/)).toBeFalsy();

    fireEvent.change(screen.getByLabelText(/Type de compte/), {
      target: { value: 'CREDIT_CARD' },
    });

    expect(screen.getByLabelText(/Jour de facturation/)).toBeTruthy();
  });

  it('shows the settlement selector only for CREDIT_CARD and refuses a card without one', async () => {
    (useAccounts as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'account-ubs-courant',
          name: 'UBS Courant',
          currency: 'CHF',
          accountType: 'CURRENT',
          status: 'ACTIVE',
        },
      ],
    });

    render(createElement(AccountCreateForm));

    // Caché pour un compte courant
    expect(screen.queryByLabelText(/Prélèvement sur/)).toBeFalsy();

    fireEvent.change(screen.getByLabelText(/Type de compte/), {
      target: { value: 'CREDIT_CARD' },
    });

    // Visible et requis pour une carte
    expect(screen.getByLabelText(/Prélèvement sur/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

    await waitFor(() =>
      expect(screen.getByText(/requires a settlement account/)).toBeTruthy()
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits a credit card with its settlement account', async () => {
    (useAccounts as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'account-ubs-courant',
          name: 'UBS Courant',
          currency: 'CHF',
          accountType: 'CURRENT',
          status: 'ACTIVE',
        },
      ],
    });

    render(createElement(AccountCreateForm));

    fireEvent.change(screen.getByLabelText('Nom du compte'), {
      target: { value: 'Carte UBS' },
    });
    fireEvent.change(screen.getByLabelText(/Type de compte/), {
      target: { value: 'CREDIT_CARD' },
    });
    fireEvent.change(screen.getByLabelText(/Prélèvement sur/), {
      target: { value: 'account-ubs-courant' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: 'CREDIT_CARD',
        linkedAccountId: 'account-ubs-courant',
      })
    );
  });

  it('shows the success panel after creation', () => {
    (useCreateAccount as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: true,
      error: null,
    });

    render(createElement(AccountCreateForm));

    expect(screen.getByText('Compte créé.')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Retour aux comptes' })
    ).toBeTruthy();
  });

  it('shows the mutation error message', () => {
    (useCreateAccount as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: false,
      error: new Error('Membre inconnu'),
    });

    render(createElement(AccountCreateForm));

    expect(screen.getByText('Membre inconnu')).toBeTruthy();
  });

  it('shows the pending label while creating', () => {
    (useCreateAccount as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isSuccess: false,
      error: null,
    });

    render(createElement(AccountCreateForm));

    expect(screen.getByRole('button', { name: 'Création…' })).toBeTruthy();
  });
});
