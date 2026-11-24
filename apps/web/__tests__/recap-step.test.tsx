/**
 * Tests for RecapStep — the month recap reads the real sources
 * (task 3.1, design D1, spec monthly-budget "Récapitulatif du mois
 * préparé"): due dates from the windowed payments query, income from
 * the month's positive transactions excluding transfers, explicit
 * due-dates/provisions decomposition.
 *
 * @module Tests/Budget/RecapStep
 */
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { RecapStep } from '@/components/budget/steps/recap-step';
import { DisplayCurrencyProvider } from '@/components/providers/display-currency-provider';

jest.mock('@/hooks/use-charges', () => ({
  useCharges: jest.fn(),
}));

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

jest.mock('@/hooks/use-schedule', () => ({
  useMonthPayments: jest.fn(),
}));

jest.mock('@/hooks/use-transactions', () => ({
  useMonthTransactions: jest.fn(),
}));

jest.mock('@/hooks/use-monthly-budget', () => ({
  useMonthlyBudget: jest.fn(() => ({ data: null })),
}));

import { useCharges } from '@/hooks/use-charges';
import { useAccounts } from '@/hooks/use-accounts';
import { useMonthPayments } from '@/hooks/use-schedule';
import { useMonthTransactions } from '@/hooks/use-transactions';

const now = '2026-01-01T00:00:00.000Z';
const MONTH = '2026-11';

const chfAccount = {
  id: 'acc-chf',
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
};

const rentCharge = {
  id: 'c-loyer',
  label: 'Loyer GE',
  type: 'FIXED_RECURRING',
  amount: 1850,
  currency: 'CHF',
  accountId: 'acc-chf',
  category: 'Logement',
  startDate: '2026-01-01',
  endDate: null,
  frequency: 'monthly',
  installments: null,
  dueDay: null,
  provisioned: false,
  createdAt: now,
  updatedAt: now,
};

const serafeCharge = {
  id: 'c-serafe',
  label: 'SERAFE',
  type: 'UPCOMING',
  amount: 335,
  currency: 'CHF',
  accountId: 'acc-chf',
  category: 'Médias',
  startDate: '2026-01-01',
  endDate: null,
  frequency: null,
  installments: null,
  dueDay: null,
  provisioned: true,
  createdAt: now,
  updatedAt: now,
};

const rentPayment = {
  id: 'p-loyer',
  chargeId: 'c-loyer',
  amount: 1850,
  currency: 'CHF',
  dueDate: '2026-11-05T00:00:00.000Z',
  status: 'PENDING',
  paidAt: null,
  transactionId: null,
  createdAt: now,
  updatedAt: now,
};

const salaryTransaction = {
  id: 'tx-salaire',
  accountId: 'acc-chf',
  amount: 4400,
  category: 'Revenus',
  date: '2026-11-05T00:00:00.000Z',
  note: 'Salaire',
  transferId: null,
  transferRole: null,
  createdAt: now,
  updatedAt: now,
};

function renderRecap(): void {
  render(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(
        DisplayCurrencyProvider,
        null,
        createElement(RecapStep, { month: MONTH })
      )
    )
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('mbongo.displayCurrency', 'CHF');
  (useAccounts as jest.Mock).mockReturnValue({ data: [chfAccount] });
  (useCharges as jest.Mock).mockReturnValue({
    data: [rentCharge, serafeCharge],
  });
  (useMonthPayments as jest.Mock).mockReturnValue({ data: [rentPayment] });
  (useMonthTransactions as jest.Mock).mockReturnValue({
    data: [salaryTransaction],
  });
});

describe('RecapStep (vraies sources, design D1)', () => {
  it('shows the full scenario: 4 400 revenus / 1 877,92 charges / 2 522,08 reste à vivre', async () => {
    renderRecap();

    // Revenus from the month's transaction.
    await waitFor(() => expect(screen.getByText('4400.00 CHF')).toBeTruthy());
    // Charges = échéances (1850) + provisions (335 / 12 = 27.92).
    expect(screen.getByText('1877.92 CHF')).toBeTruthy();
    // Reste à vivre = 4400 − 1877.92.
    expect(screen.getByText('2522.08 CHF')).toBeTruthy();
  });

  it('counts a charge created during the flow (total > 0)', async () => {
    renderRecap();

    // The rent created at the Charges step feeds the recap through its
    // windowed due date.
    await waitFor(() => expect(screen.getByText('1850.00 CHF')).toBeTruthy());
    expect(screen.getByText('Échéances (hors provisions)')).toBeTruthy();
  });

  it('computes the income from the month transaction of a source started the month before', async () => {
    // The transaction carries an incomeId of a source started in October:
    // the recap reads the November transaction, not the source.
    (useMonthTransactions as jest.Mock).mockReturnValue({
      data: [
        {
          ...salaryTransaction,
          incomeId: 'income-source-1',
          budgetMonth: MONTH,
        },
      ],
    });

    renderRecap();

    await waitFor(() => expect(screen.getByText('4400.00 CHF')).toBeTruthy());
  });

  it('displays the due-dates/provisions decomposition separately', async () => {
    renderRecap();

    await waitFor(() =>
      expect(screen.getByText('Échéances (hors provisions)')).toBeTruthy()
    );
    expect(screen.getByText('Provisions')).toBeTruthy();
    expect(screen.getByText('27.92 CHF')).toBeTruthy();
    expect(screen.getByText('1850.00 CHF')).toBeTruthy();
  });

  it('excludes transfers from the income', async () => {
    (useMonthTransactions as jest.Mock).mockReturnValue({
      data: [
        salaryTransaction,
        {
          ...salaryTransaction,
          id: 'tx-transfer',
          amount: 1000,
          transferId: 'tr-1',
          transferRole: 'TARGET',
        },
      ],
    });

    renderRecap();

    await waitFor(() => expect(screen.getByText('4400.00 CHF')).toBeTruthy());
  });

  it('shows zero income when no positive transaction exists in the month', async () => {
    (useMonthTransactions as jest.Mock).mockReturnValue({ data: [] });

    renderRecap();

    await waitFor(() => expect(screen.getByText('0.00 CHF')).toBeTruthy());
  });

  it('queries the chosen month window', () => {
    renderRecap();

    expect(useMonthPayments).toHaveBeenCalledWith(MONTH);
    expect(useMonthTransactions).toHaveBeenCalledWith(MONTH);
  });
});
