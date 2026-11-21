/**
 * Tests for IncomesStep — CRUD integration in the wizard.
 *
 * Validates:
 * - Renders income list with confirmation
 * - CreatePanel shows "Ajouter un revenu" button
 * - DeleteButton is rendered for each income row
 * - Responsive layout classes
 *
 * @module Tests/Budget/IncomesStep
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { IncomesStep } from '@/components/budget/steps/incomes-step';

jest.mock('@/hooks/use-incomes', () => ({
  useIncomes: jest.fn(),
  useConfirmIncome: jest.fn(),
  useUpdateIncome: jest.fn(),
  useDeleteIncome: jest.fn(),
  useCreateIncome: jest.fn(),
}));

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import {
  useIncomes,
  useConfirmIncome,
  useUpdateIncome,
  useDeleteIncome,
  useCreateIncome,
} from '@/hooks/use-incomes';
import { useAccounts } from '@/hooks/use-accounts';

const now = '2026-11-21T00:00:00.000Z';

const mockIncomes = [
  {
    id: 'income-salaire',
    label: 'Salaire',
    amount: 5000,
    currency: 'CHF',
    accountId: 'account-ubs-001',
    memberId: null,
    frequency: 'monthly',
    startDate: '2026-01-01',
    endDate: null,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'income-freelance',
    label: 'Freelance',
    amount: 1500,
    currency: 'EUR',
    accountId: 'account-bnp-001',
    memberId: null,
    frequency: 'monthly',
    startDate: '2026-06-01',
    endDate: null,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

const mockConfirmMutateAsync = jest.fn();
const mockUpdateMutateAsync = jest.fn();
const mockDeleteMutateAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAccounts as jest.Mock).mockReturnValue({ data: [] });
  (useIncomes as jest.Mock).mockReturnValue({
    data: mockIncomes,
    isLoading: false,
  });
  (useConfirmIncome as jest.Mock).mockReturnValue({
    mutateAsync: mockConfirmMutateAsync,
    isPending: false,
    variables: undefined,
  });
  (useUpdateIncome as jest.Mock).mockReturnValue({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
    variables: undefined,
  });
  (useDeleteIncome as jest.Mock).mockReturnValue({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  });
  (useCreateIncome as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
    data: undefined,
    error: null,
  });
});

describe('IncomesStep', () => {
  describe('rendering', () => {
    it('renders the step description', () => {
      render(<IncomesStep month="2026-11" />);

      expect(
        screen.getByText(/Confirmez vos revenus pour ce mois/)
      ).toBeTruthy();
    });

    it('renders all income sources', () => {
      render(<IncomesStep month="2026-11" />);

      expect(screen.getByText('Salaire')).toBeTruthy();
      expect(screen.getByText('Freelance')).toBeTruthy();
    });

    it('renders the empty state when no incomes', () => {
      (useIncomes as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<IncomesStep month="2026-11" />);

      expect(
        screen.getByText('Aucune source de revenu active pour ce mois.')
      ).toBeTruthy();
    });
  });

  describe('CRUD operations', () => {
    it('shows the "Ajouter un revenu" button (CreatePanel)', () => {
      render(<IncomesStep month="2026-11" />);

      expect(
        screen.getByRole('button', { name: 'Ajouter un revenu' })
      ).toBeTruthy();
    });

    it('opens the create panel when "Ajouter un revenu" is clicked', () => {
      render(<IncomesStep month="2026-11" />);

      fireEvent.click(
        screen.getByRole('button', { name: 'Ajouter un revenu' })
      );

      expect(screen.getByText('Nouveau revenu')).toBeTruthy();
      expect(screen.getByLabelText('Intitulé')).toBeTruthy();
    });

    it('renders a delete button for each income row', () => {
      render(<IncomesStep month="2026-11" />);

      const deleteButtons = screen.getAllByRole('button', {
        name: /Supprimer/,
      });
      expect(deleteButtons.length).toBe(2);
    });

    it('renders confirm button for each income row', () => {
      render(<IncomesStep month="2026-11" />);

      const confirmButtons = screen.getAllByRole('button', {
        name: 'Confirmer',
      });
      expect(confirmButtons.length).toBe(2);
    });

    it('shows frequency in the meta line', () => {
      render(<IncomesStep month="2026-11" />);

      // Both incomes have frequency "monthly"
      const frequencyElements = screen.getAllByText(/monthly/);
      expect(frequencyElements.length).toBe(2);
    });
  });

  describe('responsive layout', () => {
    it('uses responsive flex classes on the item rows', () => {
      const { container } = render(<IncomesStep month="2026-11" />);

      // EditableItem renders with responsive flex classes
      const flexElements = container.querySelectorAll('.flex-col');
      expect(flexElements.length).toBeGreaterThan(0);
    });
  });
});
