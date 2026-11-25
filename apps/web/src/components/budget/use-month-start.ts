/**
 * useMonthStart — suggested and saved logical start balances of a month.
 *
 * Suggestion = `suggestMonthStart` over the end balances of the previous
 * month (real if past, else projected), same wiring as the dashboard.
 *
 * @module Components/Budget/UseMonthStart
 */

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  computeProjectedBalance,
  suggestMonthStart,
  type AccountBalances,
} from '@mbongo/shared';
import { paymentQueries } from '@/queries/payments';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useCharges } from '@/hooks/use-charges';
import { useTransfers } from '@/hooks/use-transfers';
import { useIncomes } from '@/hooks/use-incomes';
import { useMonthStartBalances } from '@/hooks/use-month-start-balances';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import { shiftMonthKey } from '@/lib/month-navigation';

interface MonthStart {
  isLoading: boolean;
  suggested: AccountBalances;
  saved: AccountBalances;
}

export function useMonthStart(month: string): MonthStart {
  const previous = shiftMonthKey(month, -1);
  const accounts = useAccounts();
  const transactions = useTransactions();
  const charges = useCharges();
  const transfers = useTransfers();
  const incomes = useIncomes();
  const payments = useQuery(paymentQueries.pendingUntil(previous));
  const savedRows = useMonthStartBalances(month);
  const previousRows = useMonthStartBalances(previous);
  const { rate } = useDisplayCurrency();
  const now = useMemo(() => new Date(), []);

  const isLoading = [
    accounts,
    transactions,
    charges,
    transfers,
    incomes,
    payments,
    savedRows,
    previousRows,
  ].some((q) => q.isLoading);

  const suggested = useMemo(() => {
    const previousEnd = computeProjectedBalance({
      accounts: accounts.data ?? [],
      transactions: transactions.data ?? [],
      transfers: transfers.data ?? [],
      payments: payments.data ?? [],
      charges: charges.data ?? [],
      incomes: incomes.data ?? [],
      today: now,
      monthKey: previous,
      rate,
      startOverrides: Object.fromEntries(
        (previousRows.data ?? []).map((row) => [row.accountId, row.balance])
      ),
    }).balances;
    return suggestMonthStart(accounts.data ?? [], previousEnd);
  }, [
    accounts.data,
    transactions.data,
    transfers.data,
    payments.data,
    charges.data,
    incomes.data,
    now,
    previous,
    rate,
    previousRows.data,
  ]);

  const saved = useMemo(
    () =>
      Object.fromEntries(
        (savedRows.data ?? []).map((row) => [row.accountId, row.balance])
      ),
    [savedRows.data]
  );

  return { isLoading, suggested, saved };
}
