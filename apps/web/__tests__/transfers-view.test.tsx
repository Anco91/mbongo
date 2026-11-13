/**
 * Tests for TransfersView — the two-phase display.
 *
 * Domain hooks are mocked; the view must show both phases side by side,
 * "En attente du crédit" for ESTIMATED transfers, and after completion
 * the realized amount, effective rate and fees.
 *
 * @module Tests/Transfers/TransfersView
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { TransfersView } from '@/components/transfers/transfers-view';

jest.mock('@/components/transfers/hooks/use-transfers', () => ({
  useTransfers: jest.fn(),
  useCompleteTransfer: jest.fn(),
}));

jest.mock('@/components/accounts/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

import {
  useTransfers,
  useCompleteTransfer,
} from '@/components/transfers/hooks/use-transfers';
import { useAccounts } from '@/components/accounts/hooks/use-accounts';

const now = '2026-11-12T00:00:00.000Z';

const estimated = {
  id: 'transfer-1',
  sourceAccountId: 'account-ubs-courant',
  targetAccountId: 'account-bnp-perso',
  amountSent: 1500,
  rateEstimated: 1.0634,
  rateDate: '2026-11-12',
  amountReceived: null,
  rateEffective: null,
  fees: null,
  memo: null,
  status: 'ESTIMATED',
  sentAt: '2026-11-12',
  receivedAt: null,
  createdAt: now,
  updatedAt: now,
};

const accounts = [
  { id: 'account-ubs-courant', name: 'UBS Courant' },
  { id: 'account-bnp-perso', name: 'BNP Perso' },
];

const mockComplete = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAccounts as jest.Mock).mockReturnValue({ data: accounts });
  (useCompleteTransfer as jest.Mock).mockReturnValue({
    mutate: mockComplete,
    isPending: false,
    error: null,
  });
});

describe('TransfersView', () => {
  it('shows both phases with "En attente du crédit" for estimated transfers', () => {
    (useTransfers as jest.Mock).mockReturnValue({
      data: [estimated],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(createElement(TransfersView));

    // Account names resolved
    expect(screen.getByText(/UBS Courant → BNP Perso/)).toBeTruthy();
    // Status badge
    expect(screen.getByText('Estimé')).toBeTruthy();
    // Estimated counter-value: counterValue(1500, 1.0634) = 1595.10 EUR
    expect(screen.getByText(/1[\s\u00A0\u202F]?595\.10\s?€/)).toBeTruthy();
    // Phase 2 placeholder
    expect(screen.getByText('En attente du crédit')).toBeTruthy();
    // Phase 2 action present
    expect(
      screen.getByRole('button', { name: 'Enregistrer le crédit' })
    ).toBeTruthy();
  });

  it('submits the phase-2 form through useCompleteTransfer', () => {
    (useTransfers as jest.Mock).mockReturnValue({
      data: [estimated],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(createElement(TransfersView));

    fireEvent.change(screen.getByLabelText('Montant EUR crédité'), {
      target: { value: '1403.60' },
    });
    fireEvent.change(screen.getByLabelText('Date de réception'), {
      target: { value: '2026-11-13' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Enregistrer le crédit' })
    );

    expect(mockComplete).toHaveBeenCalledWith({
      id: 'transfer-1',
      input: { amountReceived: 1403.6, receivedAt: '2026-11-13' },
    });
  });

  it('shows the realized phase with effective rate and fees for completed transfers', () => {
    (useTransfers as jest.Mock).mockReturnValue({
      data: [
        {
          ...estimated,
          status: 'COMPLETED',
          amountReceived: 1403.6,
          rateEffective: 0.93573,
          fees: 191.5,
          receivedAt: '2026-11-13',
        },
      ],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(createElement(TransfersView));

    expect(screen.getByText('Réalisé')).toBeTruthy();
    // 1403.60 EUR credited
    expect(screen.getByText(/1[\s\u00A0\u202F]?403\.60\s?€/)).toBeTruthy();
    // Effective rate persisted on the transfer
    expect(screen.getByText(/Taux effectif : 0\.93573/)).toBeTruthy();
    // Fees persisted on the transfer
    expect(screen.getByText(/191\.50\s?€/)).toBeTruthy();
    // No awaiting placeholder anymore
    expect(screen.queryByText('En attente du crédit')).toBeFalsy();
  });
});

describe('TransfersView — loading and error states', () => {
  it('renders the loading state', () => {
    (useTransfers as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(createElement(TransfersView));

    expect(screen.getByText('Chargement des transferts…')).toBeTruthy();
  });

  it('renders the error panel with a retry action', () => {
    (useTransfers as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network down'),
      refetch: jest.fn(),
    });

    render(createElement(TransfersView));

    expect(screen.getByText(/Erreur lors du chargement/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeTruthy();
  });

  it('renders the empty state with a create link', () => {
    (useTransfers as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(createElement(TransfersView));

    expect(screen.getByText('Aucun transfert')).toBeTruthy();
  });

  it('retries loading when the retry button is clicked', () => {
    const refetch = jest.fn();
    (useTransfers as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network down'),
      refetch,
    });

    render(createElement(TransfersView));
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(refetch).toHaveBeenCalled();
  });

  it('ignores an invalid amount in the phase-2 form (no mutation)', () => {
    (useTransfers as jest.Mock).mockReturnValue({
      data: [estimated],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(createElement(TransfersView));

    fireEvent.change(screen.getByLabelText('Montant EUR crédité'), {
      target: { value: '0' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Enregistrer le crédit' })
    );

    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('shows the phase-2 mutation error message', () => {
    (useTransfers as jest.Mock).mockReturnValue({
      data: [estimated],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useCompleteTransfer as jest.Mock).mockReturnValue({
      mutate: mockComplete,
      isPending: false,
      error: new Error('Transfert déjà réalisé'),
    });

    render(createElement(TransfersView));

    fireEvent.change(screen.getByLabelText('Date de réception'), {
      target: { value: '2026-11-14' },
    });

    expect(screen.getByText('Transfert déjà réalisé')).toBeTruthy();
  });

  it('falls back to the id when an account is unknown', () => {
    (useTransfers as jest.Mock).mockReturnValue({
      data: [estimated],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useAccounts as jest.Mock).mockReturnValue({ data: [] });

    render(createElement(TransfersView));

    expect(
      screen.getByText(/account-ubs-courant → account-bnp-perso/)
    ).toBeTruthy();
  });
});
