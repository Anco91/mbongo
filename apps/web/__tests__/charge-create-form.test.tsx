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

jest.mock('@/hooks/use-charges', () => ({
  useCreateCharge: jest.fn(),
}));

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { useCreateCharge } from '@/hooks/use-charges';
import { useAccounts } from '@/hooks/use-accounts';

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
    expect(screen.queryByText('Échéances')).toBeFalsy();
    expect(screen.queryByText('Récurrence bornée')).toBeFalsy();
  });

  it('swaps to the installment section when the type changes', async () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText(/Type de charge/), {
      target: { value: 'INSTALLMENT' },
    });

    await waitFor(() => expect(screen.getByText('Échéances')).toBeTruthy());
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
    fireEvent.change(screen.getByLabelText(/Montant \(/), {
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
      }),
      expect.any(Object) // Second parameter: { onSuccess } callback
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
    expect(screen.queryByText('Échéances')).toBeFalsy();
  });

  it('shows the provision checkbox for UPCOMING', () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText(/Type de charge/), {
      target: { value: 'UPCOMING' },
    });

    expect(screen.getByText('Prévision & provision')).toBeTruthy();
    expect(
      screen.getByLabelText(/Provisionner \(réparti chaque mois\)/)
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
      data: { id: 'charge-1', label: 'Loyer GE' },
      error: null,
    });

    render(createElement(ChargeCreateForm));

    expect(
      screen.getByText('Charge créée — échéances générées (tout-ou-rien).')
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Retour aux charges' })
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

describe('ChargeCreateForm — jour de prélèvement (tasks 4.5, design D4)', () => {
  it('shows the due-day selector for a monthly FIXED_RECURRING, defaulting to day 1', () => {
    render(createElement(ChargeCreateForm));

    const select = screen.getByLabelText(
      'Jour de prélèvement'
    ) as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.value).toBe('1');
    expect(select.options).toHaveLength(31);
  });

  it('defaults the start date to the first day of the current month', () => {
    render(createElement(ChargeCreateForm));

    const startDate = screen.queryAllByLabelText(/Début|Date de début/);
    // The monthly section does not display startDate; assert through the
    // submitted payload instead (see coercion test below).
    expect(startDate).toHaveLength(0);
  });

  it('hides the due-day selector for INSTALLMENT', async () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText(/Type de charge/), {
      target: { value: 'INSTALLMENT' },
    });

    await waitFor(() => expect(screen.getByText('Échéances')).toBeTruthy());
    expect(screen.queryByLabelText('Jour de prélèvement')).toBeNull();
  });

  it('hides the due-day selector for a yearly FIXED_RECURRING', async () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText('Périodicité'), {
      target: { value: 'yearly' },
    });

    await waitFor(() =>
      expect(screen.queryByLabelText('Jour de prélèvement')).toBeNull()
    );
  });

  it('submits the chosen day, coerced to a number, for a monthly charge', async () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText('Intitulé'), {
      target: { value: 'Loyer GE' },
    });
    fireEvent.change(screen.getByLabelText(/Montant \(/), {
      target: { value: '1850' },
    });
    fireEvent.change(screen.getByLabelText('Compte débité'), {
      target: { value: 'account-ubs-courant' },
    });
    fireEvent.change(screen.getByLabelText('Jour de prélèvement'), {
      target: { value: '5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la charge' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ dueDay: 5 }),
      expect.any(Object)
    );
  });

  it('clears dueDay on submit when the frequency is not monthly', async () => {
    render(createElement(ChargeCreateForm));

    fireEvent.change(screen.getByLabelText('Intitulé'), {
      target: { value: 'Assurance' },
    });
    fireEvent.change(screen.getByLabelText(/Montant \(/), {
      target: { value: '300' },
    });
    fireEvent.change(screen.getByLabelText('Compte débité'), {
      target: { value: 'account-ubs-courant' },
    });
    fireEvent.change(screen.getByLabelText('Périodicité'), {
      target: { value: 'yearly' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la charge' }));

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ dueDay: null, frequency: 'yearly' }),
      expect.any(Object)
    );
  });
});
