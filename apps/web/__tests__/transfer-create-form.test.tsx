/**
 * Tests for TransferCreateForm — live counter-value preview and zod gating.
 *
 * Domain hooks are mocked. The live estimated counter-value preview must
 * use the shared counterValue function, and an invalid submission must
 * be blocked by zod before any request is sent.
 *
 * @module Tests/Transfers/TransferCreateForm
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { TransferCreateForm } from '@/components/transfers/transfer-create-form';

jest.mock('@/components/transfers/hooks/use-transfers', () => ({
  useCreateTransfer: jest.fn(),
}));

jest.mock('@/components/accounts/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

import { useCreateTransfer } from '@/components/transfers/hooks/use-transfers';
import { useAccounts } from '@/components/accounts/hooks/use-accounts';

const now = '2026-11-12T00:00:00.000Z';

const accounts = [
  {
    id: 'account-ubs-courant',
    name: 'UBS Courant',
    bank: 'UBS',
    currency: 'CHF',
    accountType: 'CURRENT',
    memberId: null,
    overdraftLimit: 0,
    deferredCard: false,
    billingDay: null,
    openingBalance: 0,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'account-bnp-perso',
    name: 'BNP Perso',
    bank: 'BNP',
    currency: 'EUR',
    accountType: 'CURRENT',
    memberId: null,
    overdraftLimit: 0,
    deferredCard: false,
    billingDay: null,
    openingBalance: 0,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  },
];

const mockMutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAccounts as jest.Mock).mockReturnValue({ data: accounts });
  (useCreateTransfer as jest.Mock).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    isSuccess: false,
    error: null,
  });
});

describe('TransferCreateForm', () => {
  it('shows the live estimated counter-value preview (counterValue)', () => {
    render(createElement(TransferCreateForm));

    fireEvent.change(screen.getByLabelText('Montant envoyé (CHF)'), {
      target: { value: '1500' },
    });
    fireEvent.change(screen.getByLabelText(/Taux de référence/), {
      target: { value: '1.0634' },
    });

    // counterValue(1500, 1.0634) = 1595.10 EUR
    expect(screen.getByText(/1[\s\u00A0\u202F]?595\.10\s?€/)).toBeTruthy();
  });

  it('blocks an empty submission through zod (no request sent)', () => {
    render(createElement(TransferCreateForm));

    fireEvent.click(
      screen.getByRole('button', { name: 'Enregistrer le transfert (estimé)' })
    );

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits a valid transfer through useCreateTransfer', async () => {
    render(createElement(TransferCreateForm));

    fireEvent.change(screen.getByLabelText('Compte source (CHF)'), {
      target: { value: 'account-ubs-courant' },
    });
    fireEvent.change(screen.getByLabelText('Compte cible (EUR)'), {
      target: { value: 'account-bnp-perso' },
    });
    fireEvent.change(screen.getByLabelText('Montant envoyé (CHF)'), {
      target: { value: '1500' },
    });
    fireEvent.change(screen.getByLabelText(/Taux de référence/), {
      target: { value: '1.0634' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Enregistrer le transfert (estimé)' })
    );

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceAccountId: 'account-ubs-courant',
        targetAccountId: 'account-bnp-perso',
        amountSent: 1500,
        rateEstimated: 1.0634,
      })
    );
  });

  it('shows the success panel after creation', () => {
    (useCreateTransfer as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isSuccess: true,
      error: null,
    });

    render(createElement(TransferCreateForm));

    expect(screen.getByText(/Transfert enregistré \(estimé\)/)).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Retour aux transferts' })
    ).toBeTruthy();
  });

  it('warns when source and target are the same account', () => {
    // Contrived fixture: the same id listed for both currencies, to
    // exercise the defensive same-account guard.
    (useAccounts as jest.Mock).mockReturnValue({
      data: [...accounts, { ...accounts[0], currency: 'EUR' as const }],
    });

    render(createElement(TransferCreateForm));

    fireEvent.change(screen.getByLabelText('Compte source (CHF)'), {
      target: { value: 'account-ubs-courant' },
    });
    fireEvent.change(screen.getByLabelText('Compte cible (EUR)'), {
      target: { value: 'account-ubs-courant' },
    });

    expect(
      screen.getByText('Le compte cible doit être différent du compte source.')
    ).toBeTruthy();
  });

  it('hides the preview when the amount is zero', () => {
    render(createElement(TransferCreateForm));

    fireEvent.change(screen.getByLabelText('Montant envoyé (CHF)'), {
      target: { value: '0' },
    });

    expect(screen.queryByText(/Contre-valeur estimée/)).toBeFalsy();
  });
});
