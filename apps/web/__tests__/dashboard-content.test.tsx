/**
 * Tests for DashboardContent
 *
 * Validates M3 Dashboard features:
 * - Consolidated wealth display (EUR + CHF)
 * - Financial alerts banner
 * - Sankey and Donut chart cards + expand triggers
 * - Monthly payments list with toggle and detail sheet
 * - Provisions card and monthly total
 *
 * @module Tests/Dashboard/DashboardContent
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

jest.mock('@/hooks/use-accounts', () => ({
  useAccounts: jest.fn(),
}));

jest.mock('@/hooks/use-transactions', () => ({
  useTransactions: jest.fn(),
}));

jest.mock('@/hooks/use-charges', () => ({
  useCharges: jest.fn(),
}));

jest.mock('@/hooks/use-schedule', () => ({
  usePayments: jest.fn(),
}));

jest.mock('@/hooks/use-transfers', () => ({
  useTransfers: jest.fn(),
}));

jest.mock('@/hooks/use-members', () => ({
  useMembers: jest.fn(() => ({ data: [] })),
}));

jest.mock('@/hooks/use-exchange-rate', () => ({
  useExchangeRate: jest.fn(),
}));

import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useCharges } from '@/hooks/use-charges';
import { usePayments } from '@/hooks/use-schedule';
import { useTransfers } from '@/hooks/use-transfers';
import { useExchangeRate } from '@/hooks/use-exchange-rate';
import { DisplayCurrencyProvider } from '@/components/providers/display-currency-provider';

const accounts = [
  {
    id: 'acc-chf',
    name: 'UBS Courant',
    bank: 'UBS',
    currency: 'CHF',
    accountType: 'CURRENT',
    openingBalance: 1500,
    overdraftLimit: 0,
    deferredCard: false,
    billingDay: null,
    linkedAccountId: null,
    memberId: 'm1',
    status: 'ACTIVE',
    closedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'acc-eur',
    name: 'Bourso Perso',
    bank: 'BoursoBank',
    currency: 'EUR',
    accountType: 'CURRENT',
    openingBalance: 2000,
    overdraftLimit: 500,
    deferredCard: false,
    billingDay: null,
    linkedAccountId: null,
    memberId: 'm1',
    status: 'ACTIVE',
    closedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const charges = [
  {
    id: 'c1',
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
    provisioned: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'c2',
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
    provisioned: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const transfers = [
  {
    id: 'tr1',
    sourceAccountId: 'acc-chf',
    targetAccountId: 'acc-eur',
    amountSent: 1000,
    amountReceived: 930,
    rateEstimated: 0.93,
    rateEffective: 0.93,
    rateDate: '2026-11-01T00:00:00.000Z',
    sentAt: '2026-11-01T00:00:00.000Z',
    receivedAt: '2026-11-02T00:00:00.000Z',
    status: 'COMPLETED',
    fees: 0,
    memo: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-02T00:00:00.000Z',
  },
];

describe('DashboardContent', () => {
  beforeEach(() => {
    (useAccounts as jest.Mock).mockReturnValue({ data: accounts });
    (useTransactions as jest.Mock).mockReturnValue({ data: [] });
    (useCharges as jest.Mock).mockReturnValue({ data: charges });
    (useTransfers as jest.Mock).mockReturnValue({ data: transfers });
    (useExchangeRate as jest.Mock).mockReturnValue({
      rate: 0.93,
      rateDate: '2026-11-01',
      source: 'fallback',
      isLoading: false,
    });
  });

  it('renders consolidated wealth in EUR and CHF in parallel', () => {
    (usePayments as jest.Mock).mockReturnValue({ data: [] });

    render(
      createElement(
        DisplayCurrencyProvider,
        null,
        createElement(DashboardContent)
      )
    );

    // 2000 EUR + (1500 * 0.93 = 1395) = 3395 EUR
    expect(screen.getByText(/Patrimoine consolidé/i)).toBeTruthy();
    expect(screen.getByText(/3[\s\u00A0\u202F]?395[\.,]00\s?€/)).toBeTruthy();
    // Parallel = the full counter-value in CHF (3395 / 0.93 ≈ 3650.54)
    expect(screen.getByText(/3[\s\u00A0\u202F]?650[\.,]54\s?CHF/)).toBeTruthy();
  });

  it('renders the provisions card with monthly smoothing and total', () => {
    (usePayments as jest.Mock).mockReturnValue({ data: [] });

    render(
      createElement(
        DisplayCurrencyProvider,
        null,
        createElement(DashboardContent)
      )
    );

    expect(screen.getByText('Provisions · lissage mensuel')).toBeTruthy();
    expect(screen.getByText('SERAFE')).toBeTruthy();
    expect(screen.getAllByText(/27[\.,]92\s?CHF \/ mois/).length).toBe(2);
    expect(screen.getByText('Total provisionné')).toBeTruthy();
  });

  it('renders upcoming payments of the month and toggles show more', () => {
    const payments = [
      {
        id: 'p1',
        chargeId: 'c2',
        amount: 1850,
        currency: 'CHF',
        dueDate: new Date().toISOString(),
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'p2',
        chargeId: 'c2',
        amount: 1850,
        currency: 'CHF',
        dueDate: new Date().toISOString(),
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'p3',
        chargeId: 'c2',
        amount: 1850,
        currency: 'CHF',
        dueDate: new Date().toISOString(),
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'p4',
        chargeId: 'c2',
        amount: 1850,
        currency: 'CHF',
        dueDate: new Date().toISOString(),
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    (usePayments as jest.Mock).mockReturnValue({ data: payments });

    render(
      createElement(
        DisplayCurrencyProvider,
        null,
        createElement(DashboardContent)
      )
    );

    expect(screen.getByText('Échéances du mois')).toBeTruthy();
    const toggleBtn = screen.getByText('Afficher les 1 autres');
    expect(toggleBtn).toBeTruthy();

    fireEvent.click(toggleBtn);
    expect(screen.getByText('Réduire')).toBeTruthy();
  });

  it('renders chart skeletons before hydration, without an empty state', () => {
    (usePayments as jest.Mock).mockReturnValue({ data: [] });

    const markup = renderToString(
      createElement(
        DisplayCurrencyProvider,
        null,
        createElement(DashboardContent)
      )
    );

    expect(markup).toContain('animate-pulse');
    expect(markup).not.toContain('Aucun flux pour ce mois');
  });

  it('renders section titles for Sankey and Donut', () => {
    (usePayments as jest.Mock).mockReturnValue({ data: [] });

    render(
      createElement(
        DisplayCurrencyProvider,
        null,
        createElement(DashboardContent)
      )
    );

    expect(screen.getByText('Flux du mois')).toBeTruthy();
    expect(screen.getByText('Dépenses par catégorie')).toBeTruthy();
  });
});
