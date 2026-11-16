/**
 * Use Balances Hook
 *
 * Computes the current balance of every account from its transactions
 * (shared source for the dashboard, the alerts and the bell badge).
 *
 * @module Hooks/UseBalances
 */

'use client';

import { useMemo } from 'react';
import { computeBalance } from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';

/**
 * Map account id → current balance (opening balance + transactions).
 */
export function useBalances(): Record<string, number> {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();

  return useMemo(() => {
    const map: Record<string, number> = {};
    for (const acc of accounts) {
      const accTxs = transactions.filter((t) => t.accountId === acc.id);
      map[acc.id] = computeBalance(acc, accTxs);
    }
    return map;
  }, [accounts, transactions]);
}
