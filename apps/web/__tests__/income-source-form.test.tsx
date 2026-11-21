/**
 * Tests for IncomeSourceForm — dual mode (inline vs page) and zod gating.
 *
 * Validates:
 * - Form renders all required fields
 * - Valid submission reaches the mutation
 * - Empty submission is blocked by zod
 * - Inline mode (onSaved) calls callback and skips FormSuccess
 * - Page mode shows FormSuccess and redirect button
 *
 * @module Tests/Incomes/IncomeSourceForm
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { IncomeSourceForm } from '@/components/incomes/income-source-form';

jest.mock('@/hooks/use-incomes', () => ({
  useCreateIncome: jest.fn(),
}));

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { useCreateIncome } from '@/hooks/use-incomes';
import { useAccounts } from '@/hooks/use-accounts';

const now = '2026-11-21T00:00:00.000Z';

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
  (useCreateIncome as jest.Mock).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
    data: undefined,
    error: null,
  });
});

describe('IncomeSourceForm', () => {
  describe('rendering', () => {
    it('renders all required fields', () => {
      render(createElement(IncomeSourceForm));

      expect(screen.getByLabelText('Intitulé')).toBeTruthy();
      expect(screen.getByLabelText(/Montant/)).toBeTruthy();
      expect(screen.getByLabelText('Compte crédité')).toBeTruthy();
      expect(screen.getByLabelText('Périodicité')).toBeTruthy();
      expect(screen.getByLabelText('Date de début')).toBeTruthy();
      expect(screen.getByLabelText(/Date de fin/)).toBeTruthy();
    });

    it('renders the submit button', () => {
      render(createElement(IncomeSourceForm));

      expect(
        screen.getByRole('button', { name: 'Créer le revenu' })
      ).toBeTruthy();
    });
  });

  describe('validation', () => {
    it('blocks an empty submission through zod (no request sent)', () => {
      render(createElement(IncomeSourceForm));

      fireEvent.click(screen.getByRole('button', { name: 'Créer le revenu' }));

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('submits a valid income through useCreateIncome', async () => {
      render(createElement(IncomeSourceForm));

      fireEvent.change(screen.getByLabelText('Intitulé'), {
        target: { value: 'Salaire' },
      });
      fireEvent.change(screen.getByLabelText(/Montant/), {
        target: { value: '5000' },
      });
      fireEvent.change(screen.getByLabelText('Compte crédité'), {
        target: { value: 'account-ubs-courant' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Créer le revenu' }));

      await waitFor(() => expect(mockMutate).toHaveBeenCalled());
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Salaire',
          amount: 5000,
          accountId: 'account-ubs-courant',
          frequency: 'monthly',
        }),
        expect.any(Object) // Second parameter: { onSuccess } callback
      );
    });
  });

  describe('dual mode', () => {
    it('shows FormSuccess in page mode when income is created', () => {
      (useCreateIncome as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        data: { id: 'income-1', label: 'Salaire' },
        error: null,
      });

      render(createElement(IncomeSourceForm));

      expect(screen.getByText('Source de revenu créée.')).toBeTruthy();
      expect(
        screen.getByRole('button', { name: 'Retour aux revenus' })
      ).toBeTruthy();
    });

    it('does NOT show FormSuccess in inline mode (onSaved provided)', () => {
      (useCreateIncome as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        data: { id: 'income-1', label: 'Salaire' },
        error: null,
      });

      const onSaved = jest.fn();
      render(createElement(IncomeSourceForm, { onSaved }));

      expect(screen.queryByText('Source de revenu créée.')).toBeNull();
      expect(
        screen.queryByRole('button', { name: 'Retour aux revenus' })
      ).toBeNull();
    });

    it('calls onSaved callback in inline mode on successful creation', async () => {
      const onSaved = jest.fn();
      const mockIncome = { id: 'income-1', label: 'Salaire' };

      (useCreateIncome as jest.Mock).mockReturnValue({
        mutate: (
          data: unknown,
          options?: { onSuccess?: (income: unknown) => void }
        ) => {
          mockMutate(data, options);
          if (options?.onSuccess) {
            options.onSuccess(mockIncome);
          }
        },
        isPending: false,
        data: undefined,
        error: null,
      });

      render(createElement(IncomeSourceForm, { onSaved }));

      fireEvent.change(screen.getByLabelText('Intitulé'), {
        target: { value: 'Salaire' },
      });
      fireEvent.change(screen.getByLabelText(/Montant/), {
        target: { value: '5000' },
      });
      fireEvent.change(screen.getByLabelText('Compte crédité'), {
        target: { value: 'account-ubs-courant' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Créer le revenu' }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(mockIncome));
    });
  });

  describe('error handling', () => {
    it('shows the mutation error message', () => {
      (useCreateIncome as jest.Mock).mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        data: undefined,
        error: new Error('Compte inconnu'),
      });

      render(createElement(IncomeSourceForm));

      expect(screen.getByText('Compte inconnu')).toBeTruthy();
    });
  });
});
