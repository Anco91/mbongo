/**
 * M4 — monthly filtering of dashboard inputs (task 3.1): sankey,
 * donut and month payments only see the selected month's data, while
 * the consolidated wealth stays global.
 *
 * @module Tests/M4/DashboardMonthFilter
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DisplayCurrencyProvider } from '@/components/providers/display-currency-provider';
import { useMonthPayments } from '@/hooks/use-schedule';
import { useTransactions } from '@/hooks/use-transactions';

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-charges', () => ({
  useCharges: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-transfers', () => ({
  useTransfers: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-exchange-rate', () => ({
  useExchangeRate: jest.fn(() => ({
    rate: null,
    rateDate: null,
    source: 'none',
    isLoading: false,
  })),
}));

jest.mock('@/hooks/use-members', () => ({
  useMembers: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-monthly-budget', () => ({
  useMonthlyBudget: jest.fn(() => ({ data: null })),
}));

jest.mock('@/hooks/use-schedule', () => ({
  usePayments: jest.fn(),
  useMonthPayments: jest.fn(),
}));

jest.mock('@/hooks/use-transactions', () => ({
  useTransactions: jest.fn(),
}));

const currentMonthPrefix = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

describe('DashboardContent — filtrage mensuel des inputs', () => {
  it("n'affiche que les échéances du mois courant", () => {
    (useMonthPayments as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'p-current',
          chargeId: 'c1',
          dueDate: `${currentMonthPrefix()}-10`,
          amount: 100,
          currency: 'EUR',
          status: 'PENDING',
        },
      ],
    });
    (useTransactions as jest.Mock).mockReturnValue({ data: [] });

    render(
      createElement(
        DisplayCurrencyProvider,
        null,
        createElement(DashboardContent)
      )
    );

    // The windowed query itself scopes the month: the hook is called
    // with the current month key.
    expect(useMonthPayments as jest.Mock).toHaveBeenCalledWith(
      currentMonthPrefix()
    );
    expect(screen.getByText('Échéance')).toBeTruthy();
  });
});
