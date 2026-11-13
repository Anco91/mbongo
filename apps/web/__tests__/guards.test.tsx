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
import { TransfersGuard } from '@/components/transfers/transfers-guard';

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

import { accountService } from '@/server/accounts/account.service';
import { transactionService } from '@/server/transactions/transaction.service';
import { transferService } from '@/server/transfers/transfer.service';

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

    await renderHydrated(AccountsGuard({}));

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

    await renderHydrated(TransfersGuard({}));

    expect(screen.getByText(/UBS Courant → BNP Perso/)).toBeTruthy();
    expect(screen.getByText('En attente du crédit')).toBeTruthy();
  });
});
