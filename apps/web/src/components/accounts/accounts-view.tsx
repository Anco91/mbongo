/**
 * Accounts View Component
 *
 * Client-side view: list of active accounts with computed balances
 * (opening balance + signed transactions, via shared computeBalance — R9).
 *
 * @module Components/Accounts/AccountsView
 */

'use client';

import { useAccounts } from './hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { computeBalance } from '@mbongo/shared';
import Link from 'next/link';
import { JSX } from 'react';

/**
 * AccountsView Component
 */
export function AccountsView(): JSX.Element {
  const { data: accounts = [], isLoading, error, refetch } = useAccounts();
  const { data: transactions = [] } = useTransactions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="ml-2">Loading accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <h3 className="font-semibold text-red-700 mb-2">
          Error loading accounts
        </h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={() => {
            void refetch();
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Closed accounts disappear from the current view (history preserved).
  const activeAccounts = accounts.filter(
    (account) => account.status === 'ACTIVE'
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Comptes</h1>
        <Link
          href="/comptes/nouveau"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Nouveau compte
        </Link>
      </div>

      {activeAccounts.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            No accounts yet
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first account to start tracking balances.
          </p>
          <Link
            href="/comptes/nouveau"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Create Account
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeAccounts.map((account) => {
            const balance = computeBalance(
              account,
              transactions.filter(
                (transaction) => transaction.accountId === account.id
              )
            );
            return (
              <div
                key={account.id}
                className="bg-white shadow rounded-lg p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {account.name}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-gray-400">
                      {account.bank ?? '—'} · {account.currency}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {account.accountType}
                  </span>
                </div>
                <p
                  className={`mt-2 text-lg font-semibold ${
                    balance < 0 ? 'text-red-600' : 'text-gray-900'
                  }`}
                >
                  {formatAmount(balance, account.currency)}
                </p>
                {account.overdraftLimit > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Découvert autorisé :{' '}
                    {formatAmount(account.overdraftLimit, account.currency)}
                  </p>
                )}
                {account.deferredCard && (
                  <p className="mt-1 text-xs text-gray-500">
                    Carte à débit différé
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Format amount with currency
 */
function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
