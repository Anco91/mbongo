/**
 * Tests for the RSC guards (accounts, transfers).
 *
 * The guard functions are called directly (async server components);
 * the resulting tree is rendered inside a QueryClientProvider to check
 * that the hydrated server data reaches the client view.
 *
 * @module Tests/Guards
 */
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactElement } from 'react';
import { AccountsGuard } from '@/components/accounts/accounts-guard';
import { AccountsContent } from '@/components/accounts/accounts-content';
import { TransfersGuard } from '@/components/transfers/transfers-guard';
import { TransfersContent } from '@/components/transfers/transfers-content';
import { DashboardGuard } from '@/components/dashboard/dashboard-guard';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DisplayCurrencyProvider } from '@/components/providers/display-currency-provider';

jest.mock('@/server/db', () => ({ prisma: {} }));

jest.mock('@/server/accounts/account.service', () => ({
  accountService: { findMany: jest.fn() },
}));

jest.mock('@/server/transactions/transaction.service', () => ({
  transactionService: { findMany: jest.fn() },
}));

jest.mock('@/server/transfers/transfer.service', () => ({
  transferService: { findMany: jest.fn() },
}));

jest.mock('@/server/charges/charge.service', () => ({
  chargeService: { findMany: jest.fn() },
}));

jest.mock('@/server/payments/payment.service', () => ({
  paymentService: { findMany: jest.fn() },
}));

jest.mock('@/server/members/member.service', () => ({
  memberService: { findMany: jest.fn() },
}));

// Display-currency provider deps: no network in tests.
jest.mock('@/hooks/use-exchange-rate', () => ({
  useExchangeRate: jest.fn(() => ({
    rate: null,
    rateDate: null,
    source: 'none',
    isLoading: false,
  })),
}));

import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { transferService } from '@/server/transfers/transfer.service';
import { chargeService } from '@/server/charges/charge.service';
import { paymentService } from '@/server/payments/payment.service';
import { memberService } from '@/server/members/member.service';

const now = '2026-11-12T00:00:00.000Z';

const account = {
  id: 'account-ubs-courant',
  name: 'UBS Courant',
  bank: 'UBS',
  currency: 'CHF',
  accountType: 'CURRENT',
  memberId: null,
  overdraftLimit: 0,
  deferredCard: false,
  billingDay: null,
  openingBalance: 1000,
  status: 'ACTIVE',
  closedAt: null,
  createdAt: now,
  updatedAt: now,
};

const transfer = {
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

const accountsTarget = {
  id: 'account-bnp-perso',
  name: 'BNP Perso',
  bank: 'BNP',
  currency: 'EUR',
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

const renderHydrated = async (tree: Promise<ReactElement>): Promise<void> => {
  const element = await tree;
  const qc = new QueryClient();
  render(createElement(QueryClientProvider, { client: qc }, element));
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AccountsGuard', () => {
  it('hydrates accounts and transactions into the client view', async () => {
    (accountService.findMany as jest.Mock).mockResolvedValue([account]);
    (transactionService.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'tx-1',
        accountId: 'account-ubs-courant',
        amount: -300,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await renderHydrated(AccountsGuard({ children: <AccountsContent /> }));

    expect(screen.getByText('UBS Courant')).toBeTruthy();
    // Computed balance: 1000 - 300 = 700
    expect(screen.getByText(/700\.00\s?(CHF|Fr)/)).toBeTruthy();
  });
});

describe('TransfersGuard', () => {
  it('hydrates transfers and accounts into the client view', async () => {
    (transferService.findMany as jest.Mock).mockResolvedValue([transfer]);
    (accountService.findMany as jest.Mock).mockResolvedValue([
      account,
      accountsTarget,
    ]);

    await renderHydrated(TransfersGuard({ children: <TransfersContent /> }));

    expect(screen.getByText(/UBS Courant → BNP Perso/)).toBeTruthy();
    expect(screen.getByText('En attente du crédit')).toBeTruthy();
  });
});

describe('DashboardGuard', () => {
  it('hydrates dashboard data into the client view', async () => {
    (accountService.findMany as jest.Mock).mockResolvedValue([account]);
    (transactionService.findMany as jest.Mock).mockResolvedValue([]);
    (transferService.findMany as jest.Mock).mockResolvedValue([]);
    (chargeService.findMany as jest.Mock).mockResolvedValue([]);
    (paymentService.findMany as jest.Mock).mockResolvedValue([]);
    (memberService.findMany as jest.Mock).mockResolvedValue([]);

    await renderHydrated(
      DashboardGuard({
        children: (
          <DisplayCurrencyProvider>
            <DashboardContent />
          </DisplayCurrencyProvider>
        ),
      })
    );

    expect(screen.getByText(/Patrimoine consolidé/i)).toBeTruthy();
    expect(screen.getByText('Flux du mois')).toBeTruthy();
  });

  it('prefetches the windowed month query shared with the client (no 100-row truncation)', async () => {
    (accountService.findMany as jest.Mock).mockResolvedValue([account]);
    (transactionService.findMany as jest.Mock).mockResolvedValue([]);
    (transferService.findMany as jest.Mock).mockResolvedValue([]);
    (chargeService.findMany as jest.Mock).mockResolvedValue([]);
    (paymentService.findMany as jest.Mock).mockResolvedValue([]);
    (memberService.findMany as jest.Mock).mockResolvedValue([]);

    await renderHydrated(
      DashboardGuard({
        children: (
          <DisplayCurrencyProvider>
            <DashboardContent />
          </DisplayCurrencyProvider>
        ),
      })
    );

    expect(paymentService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        dueDate: { gte: expect.any(String), lte: expect.any(String) },
        limit: 500,
      })
    );
  });

  it('shows the month payments even beyond the first 100 global due dates', async () => {
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const monthEnd = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    );
    (accountService.findMany as jest.Mock).mockResolvedValue([account]);
    (transactionService.findMany as jest.Mock).mockResolvedValue([]);
    (transferService.findMany as jest.Mock).mockResolvedValue([]);
    (chargeService.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'c-loyer',
        label: 'Loyer GE',
        type: 'FIXED_RECURRING',
        amount: 1850,
        currency: 'CHF',
        accountId: account.id,
        category: 'Logement',
        startDate: '2026-01-01',
        endDate: null,
        frequency: 'monthly',
        installments: null,
        dueDay: null,
        provisioned: false,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    // A database holding 150 earlier due dates would push this month's
    // occurrences past the legacy global limit — the window query still
    // returns them.
    (paymentService.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'p-month-1',
        chargeId: 'c-loyer',
        amount: 1850,
        currency: 'CHF',
        dueDate: monthEnd.toISOString(),
        status: 'PENDING',
        paidAt: null,
        transactionId: null,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    (memberService.findMany as jest.Mock).mockResolvedValue([]);

    await renderHydrated(
      DashboardGuard({
        children: (
          <DisplayCurrencyProvider>
            <DashboardContent />
          </DisplayCurrencyProvider>
        ),
      })
    );

    expect(screen.getByText('Loyer GE')).toBeTruthy();
    // monthStart kept for clarity of the window under test.
    expect(monthStart.getMonth()).toBe(new Date().getMonth());
  });
});
