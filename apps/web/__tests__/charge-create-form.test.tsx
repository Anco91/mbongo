/**
 * Tests for ChargeCreateForm — conditional sections and zod gating.
 *
 * The form adapts its fields to the selected charge type; a valid
 * submission reaches the mutation, an empty one is blocked by zod.
 *
 * @module Tests/Charges/ChargeCreateForm
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { ChargeCreateForm } from '@/components/charges/charge-create-form';

jest.mock('@/components/charges/hooks/use-charges', () => ({
  useCreateCharge: jest.fn(),
}));

jest.mock('@/components/accounts/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

import { useCreateCharge } from '@/components/charges/hooks/use-charges';
import { useAccounts } from '@/components/accounts/hooks/use-accounts';

const now = '2026-11-12T00:00:00.000Z';

const mockMutate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAccounts as jest.Mock).mockReturnValue({
    data: [
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
    ],
  });
  (useCreateCharge as jest.Mock).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    data: undefined,
    error: null,
  });
});

describe('ChargeCreateForm', () => {
  it('shows the recurrence section for FIXED_RECURRING by default', () => {
    render(createElement(ChargeCreateForm));

    expect(screen.getByText('Récurrence')).toBeTruthy();
    expect(screen.getByLabelText('Périodicité')).toBeTruthy();
    // Sections of other types are hidden
    expect(screen.queryByText('Échéancier')).toBeFalsy();
    expect(screen.queryByText('Récurrence bornée')).toBeFalsy();
  });

  it('swaps to the installment section when the type changes', async () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText(/Type de charge/), {
      target: { value: 'INSTALLMENT' },
    });

    await waitFor(() => expect(screen.getByText('Échéancier')).toBeTruthy());
    expect(screen.getByLabelText("Nombre d'échéances")).toBeTruthy();
    expect(screen.queryByText('Récurrence')).toBeFalsy();
  });

  it('blocks an empty submission through zod (no request sent)', () => {
    render(createElement(ChargeCreateForm));

    fireEvent.click(screen.getByRole('button', { name: 'Créer la charge' }));

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits a valid charge through useCreateCharge', async () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText('Intitulé'), {
      target: { value: 'Loyer GE' },
    });
    fireEvent.change(screen.getByLabelText('Montant'), {
      target: { value: '1850' },
    });
    fireEvent.change(screen.getByLabelText('Compte débité'), {
      target: { value: 'account-ubs-courant' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la charge' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'Loyer GE',
        amount: 1850,
        accountId: 'account-ubs-courant',
      })
    );
  });

  it('shows the bounded recurrence section for TEMPORARY', () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText(/Type de charge/), {
      target: { value: 'TEMPORARY' },
    });

    expect(screen.getByText('Récurrence bornée')).toBeTruthy();
    expect(screen.getByLabelText(/Fin de l'engagement/)).toBeTruthy();
    expect(screen.queryByText('Récurrence')).toBeFalsy();
  });

  it('shows the one-off payment section for ONE_OFF', () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText(/Type de charge/), {
      target: { value: 'ONE_OFF' },
    });

    expect(screen.getByText('Paiement')).toBeTruthy();
    expect(screen.queryByText('Récurrence')).toBeFalsy();
    expect(screen.queryByText('Échéancier')).toBeFalsy();
  });

  it('shows the provision checkbox for UPCOMING', () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText(/Type de charge/), {
      target: { value: 'UPCOMING' },
    });

    expect(screen.getByText('Prévision & provision')).toBeTruthy();
    expect(
      screen.getByLabelText(/Provisionner \(lissage mensuel\)/)
    ).toBeTruthy();
  });

  it('shows the type hint of the active type', () => {
    render(createElement(ChargeCreateForm));

    expect(screen.getByText(/Loyer, LaMaL, assurance/)).toBeTruthy();
  });

  it('shows the success panel when the charge was created', () => {
    (useCreateCharge as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      data: { paymentsError: null },
      error: null,
    });

    render(createElement(ChargeCreateForm));

    expect(screen.getByText('Charge créée — échéances générées.')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Retour aux charges' })
    ).toBeTruthy();
  });

  it('warns when the payments generation failed after creation', () => {
    (useCreateCharge as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      data: { paymentsError: 'boom' },
      error: null,
    });

    render(createElement(ChargeCreateForm));

    expect(
      screen.getByText(
        'Charge créée, mais la génération des échéances a échoué.'
      )
    ).toBeTruthy();
  });

  it('shows the mutation error message', () => {
    (useCreateCharge as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      data: undefined,
      error: new Error('Compte inconnu'),
    });

    render(createElement(ChargeCreateForm));

    expect(screen.getByText('Compte inconnu')).toBeTruthy();
  });
});
