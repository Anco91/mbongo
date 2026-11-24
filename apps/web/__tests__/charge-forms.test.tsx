/**
 * Tests for the charge forms — a successful creation is confirmed before
 * returning to the list, and a deletion settles before navigating.
 *
 * @module Tests/Charges/ChargeForms
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { ChargeCreateForm } from '@/components/charges/charge-create-form';
import { ChargeEditForm } from '@/components/charges/charge-edit-form';

const push = jest.fn();
const createCharge = jest.fn();
const deleteCharge = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@/hooks/use-charges', () => ({
  useCharges: jest.fn(),
  useCharge: jest.fn(),
  useChargePayments: jest.fn(),
  useCreateCharge: jest.fn(),
  useUpdateCharge: jest.fn(),
  useDeleteCharge: jest.fn(),
}));

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

import {
  useCharge,
  useCreateCharge,
  useUpdateCharge,
  useDeleteCharge,
} from '@/hooks/use-charges';
import { useAccounts } from '@/hooks/use-accounts';

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

const charge = {
  id: 'charge-1',
  label: 'Loyer GE',
  type: 'FIXED_RECURRING',
  amount: 1500,
  currency: 'CHF',
  accountId: account.id,
  category: 'Logement',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: null,
  frequency: 'monthly',
  installments: null,
  provisioned: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAccounts as jest.Mock).mockReturnValue({ data: [account] });
  (useCreateCharge as jest.Mock).mockReturnValue({
    mutate: createCharge,
    isPending: false,
    data: undefined,
    error: null,
  });
  (useUpdateCharge as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
    isSuccess: false,
    error: null,
  });
  (useDeleteCharge as jest.Mock).mockReturnValue({
    mutateAsync: deleteCharge,
  });
});

describe('ChargeCreateForm', () => {
  it('confirms the creation before offering the return to the list', () => {
    (useCreateCharge as jest.Mock).mockReturnValue({
      mutate: createCharge,
      isPending: false,
      data: charge,
      error: null,
    });

    render(createElement(ChargeCreateForm));

    expect(screen.getByRole('status').textContent).toBe(
      'Charge créée — échéances générées (tout-ou-rien).'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retour aux charges' }));
    expect(push).toHaveBeenCalledWith('/charges');
  });
});

describe('ChargeEditForm', () => {
  beforeEach(() => {
    (useCharge as jest.Mock).mockReturnValue({
      data: charge,
      isLoading: false,
    });
  });

  it('navigates only after the deletion settles', async () => {
    let resolveDelete: () => void = () => undefined;
    deleteCharge.mockReturnValue(
      new Promise<void>((done) => {
        resolveDelete = done;
      })
    );

    render(createElement(ChargeEditForm, { chargeId: charge.id }));

    fireEvent.click(
      screen.getByRole('button', { name: 'Supprimer la charge' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(deleteCharge).toHaveBeenCalledWith(charge.id);
    expect(push).not.toHaveBeenCalled();

    resolveDelete();

    await waitFor(() => expect(push).toHaveBeenCalledWith('/charges'));
  });
});

describe('ChargeEditForm — jour de prélèvement (tasks 4.5, design D4)', () => {
  const updateMutate = jest.fn();

  beforeEach(() => {
    (useUpdateCharge as jest.Mock).mockReturnValue({
      mutate: updateMutate,
      isPending: false,
      isSuccess: false,
      error: null,
    });
  });

  it('prefills the due day with the persisted value, falling back to the start-date day', () => {
    (useCharge as jest.Mock).mockReturnValue({
      data: { ...charge, dueDay: 5 },
      isLoading: false,
    });

    render(createElement(ChargeEditForm, { chargeId: charge.id }));

    const select = screen.getByLabelText(
      'Jour de prélèvement'
    ) as HTMLSelectElement;
    expect(select.value).toBe('5');
  });

  it('falls back to the start-date day when the charge has no dueDay (legacy)', () => {
    (useCharge as jest.Mock).mockReturnValue({
      data: charge,
      isLoading: false,
    });

    render(createElement(ChargeEditForm, { chargeId: charge.id }));

    const select = screen.getByLabelText(
      'Jour de prélèvement'
    ) as HTMLSelectElement;
    // startDate is the 1st — legacy anchor day.
    expect(select.value).toBe('1');
  });

  it('hides the due day outside the monthly recurrence', () => {
    (useCharge as jest.Mock).mockReturnValue({
      data: { ...charge, type: 'INSTALLMENT', frequency: null },
      isLoading: false,
    });

    render(createElement(ChargeEditForm, { chargeId: charge.id }));

    expect(screen.queryByLabelText('Jour de prélèvement')).toBeNull();
  });

  it('submits the chosen due day', async () => {
    (useCharge as jest.Mock).mockReturnValue({
      data: { ...charge, dueDay: 1 },
      isLoading: false,
    });

    render(createElement(ChargeEditForm, { chargeId: charge.id }));

    fireEvent.change(screen.getByLabelText('Jour de prélèvement'), {
      target: { value: '5' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Enregistrer les modifications' })
    );

    await waitFor(() => expect(updateMutate).toHaveBeenCalled());
    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ dueDay: 5 })
    );
  });
});
