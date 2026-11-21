/**
 * Tests for AccountsStep — CRUD integration in the wizard.
 *
 * Validates:
 * - Renders account list with balance adjustment
 * - CreatePanel shows "Ajouter un compte" button
 * - DeleteButton (Fermer) is rendered for each account row
 * - Responsive layout classes
 *
 * @module Tests/Budget/AccountsStep
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AccountsStep } from '@/components/budget/steps/accounts-step';

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
  useUpdateAccount: jest.fn(),
  useCloseAccount: jest.fn(),
  useCreateAccount: jest.fn(),
}));

jest.mock('@/hooks/use-members', () => ({
  useMembers: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import {
  useAccounts,
  useUpdateAccount,
  useCloseAccount,
  useCreateAccount,
} from '@/hooks/use-accounts';
import { useMembers } from '@/hooks/use-members';

const now = '2026-11-21T00:00:00.000Z';

const mockAccounts = [
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
    linkedAccountId: null,
    openingBalance: 2500,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'account-bnp-epargne',
    name: 'BNP Épargne',
    bank: 'BNP Paribas',
    currency: 'EUR',
    accountType: 'SAVINGS',
    memberId: null,
    overdraftLimit: 0,
    deferredCard: false,
    billingDay: null,
    linkedAccountId: null,
    openingBalance: 10000,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  },
];

const mockUpdateMutateAsync = jest.fn();
const mockCloseMutateAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useMembers as jest.Mock).mockReturnValue({ data: [] });
  (useAccounts as jest.Mock).mockReturnValue({
    data: mockAccounts,
    isLoading: false,
  });
  (useUpdateAccount as jest.Mock).mockReturnValue({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
    variables: undefined,
  });
  (useCloseAccount as jest.Mock).mockReturnValue({
    mutateAsync: mockCloseMutateAsync,
    isPending: false,
  });
  (useCreateAccount as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
    data: undefined,
    error: null,
  });
});

describe('AccountsStep', () => {
  describe('rendering', () => {
    it('renders the step description', () => {
      render(<AccountsStep />);

      expect(screen.getByText(/Vérifiez vos comptes actifs/)).toBeTruthy();
    });

    it('renders all active accounts', () => {
      render(<AccountsStep />);

      expect(screen.getByText('UBS Courant')).toBeTruthy();
      expect(screen.getByText('BNP Épargne')).toBeTruthy();
    });

    it('renders the empty state when no active accounts', () => {
      (useAccounts as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
      });

      render(<AccountsStep />);

      expect(screen.getByText('Aucun compte actif.')).toBeTruthy();
    });

    it('filters out closed accounts', () => {
      (useAccounts as jest.Mock).mockReturnValue({
        data: [
          ...mockAccounts,
          {
            id: 'account-closed',
            name: 'Compte Fermé',
            bank: 'UBS',
            currency: 'CHF',
            status: 'CLOSED',
          },
        ],
        isLoading: false,
      });

      render(<AccountsStep />);

      expect(screen.queryByText('Compte Fermé')).toBeNull();
    });
  });

  describe('CRUD operations', () => {
    it('shows the "Ajouter un compte" button (CreatePanel)', () => {
      render(<AccountsStep />);

      expect(
        screen.getByRole('button', { name: 'Ajouter un compte' })
      ).toBeTruthy();
    });

    it('opens the create panel when "Ajouter un compte" is clicked', () => {
      render(<AccountsStep />);

      fireEvent.click(
        screen.getByRole('button', { name: 'Ajouter un compte' })
      );

      expect(screen.getByText('Nouveau compte')).toBeTruthy();
      expect(screen.getByLabelText('Nom du compte')).toBeTruthy();
    });

    it('renders a close/fermer button for each account row', () => {
      render(<AccountsStep />);

      const closeButtons = screen.getAllByRole('button', {
        name: /Fermer/,
      });
      expect(closeButtons.length).toBe(2);
    });

    it('renders adjust button for each account row', () => {
      render(<AccountsStep />);

      const adjustButtons = screen.getAllByRole('button', {
        name: 'Ajuster',
      });
      expect(adjustButtons.length).toBe(2);
    });

    it('shows account balance in the input placeholder', () => {
      render(<AccountsStep />);

      const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[];
      expect(inputs[0].placeholder).toBe('2500');
      expect(inputs[1].placeholder).toBe('10000');
    });

    it('shows bank name in the meta line', () => {
      render(<AccountsStep />);

      expect(screen.getByText(/UBS — CHF/)).toBeTruthy();
      expect(screen.getByText(/BNP Paribas — EUR/)).toBeTruthy();
    });
  });

  describe('responsive layout', () => {
    it('uses responsive flex classes on the item rows', () => {
      const { container } = render(<AccountsStep />);

      // EditableItem renders with responsive flex classes
      const flexElements = container.querySelectorAll('.flex-col');
      expect(flexElements.length).toBeGreaterThan(0);
    });
  });
});
