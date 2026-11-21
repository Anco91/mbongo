/**
 * useDashboardData — orchestration pure des données du dashboard
 * (M4, design D3). Les vues (cards) ne calculent rien : elles reçoivent
 * des données prêtes. Le patrimoine et le taux restent l'état du jour ;
 * sankey / donut / échéances sont filtrés sur le mois choisi.
 *
 * @module Components/Dashboard/UseDashboardData
 */

'use client';

import { useMemo } from 'react';
import {
  computeBalance,
  computeConsolidatedBalance,
  computeDonutExpenses,
  computeSankeyFlows,
  computeMonthlyBudget,
  monthRange,
  isInMonth,
  type Account,
  type Charge,
  type Payment,
  type CategoryExpense,
  type SankeyData,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useCharges } from '@/hooks/use-charges';
import { usePayments } from '@/hooks/use-schedule';
import { useTransfers } from '@/hooks/use-transfers';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import { monthKeyToDate } from '@/lib/month-navigation';

interface DashboardData {
  accounts: Account[];
  charges: Charge[];
  accountsById: Map<string, Account>;
  chargesById: Map<string, Charge>;
  consolidated: ReturnType<typeof computeConsolidatedBalance>;
  rate: number | null;
  sankeyData: SankeyData;
  donutData: CategoryExpense[];
  monthPayments: Payment[];
  /** Total charges for the selected month (for BudgetPreparationCard). */
  totalCharges: number;
  now: Date;
}

export function useDashboardData(selectedMonth: string): DashboardData {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: charges = [] } = useCharges();
  const { data: payments = [] } = usePayments();
  const { data: transfers = [] } = useTransfers();
  // Devise d'affichage partagée + taux courant (live prioritaire, fallback transferts).
  const { rate, rateDate } = useDisplayCurrency();

  const accountsById = useMemo(
    () => new Map(accounts.map((acc) => [acc.id, acc])),
    [accounts]
  );

  const chargesById = useMemo(
    () => new Map(charges.map((c) => [c.id, c])),
    [charges]
  );

  // Soldes par compte (état du jour — patrimoine global).
  const balances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const acc of accounts) {
      const accTxs = transactions.filter((t) => t.accountId === acc.id);
      map[acc.id] = computeBalance(acc, accTxs);
    }
    return map;
  }, [accounts, transactions]);

  // Patrimoine consolidé — au taux courant (live prioritaire, fallback transferts).
  const consolidated = useMemo(
    () =>
      computeConsolidatedBalance(
        accounts,
        balances,
        transfers,
        rate != null && rateDate != null ? { rate, rateDate } : null
      ),
    [accounts, balances, transfers, rate, rateDate]
  );

  // Fenêtre mensuelle du mois choisi (curseur).
  const monthWindow = useMemo(
    () => monthRange(`${selectedMonth}-01`),
    [selectedMonth]
  );

  const monthTransactions = useMemo(
    () => transactions.filter((t) => isInMonth(t.date, monthWindow)),
    [transactions, monthWindow]
  );

  const monthTransfers = useMemo(
    () => transfers.filter((t) => isInMonth(t.sentAt, monthWindow)),
    [transfers, monthWindow]
  );

  const monthPayments = useMemo(
    () => payments.filter((p) => isInMonth(p.dueDate, monthWindow)),
    [payments, monthWindow]
  );

  // Total charges for the selected month (for BudgetPreparationCard).
  // Uses computeMonthlyBudget with the month's payments to get the correct total.
  const totalCharges = useMemo(() => {
    const monthDate = monthKeyToDate(selectedMonth);
    const { total } = computeMonthlyBudget(charges, payments, monthDate);
    return total;
  }, [charges, payments, selectedMonth]);

  const sankeyData = useMemo(
    () =>
      computeSankeyFlows({
        accounts,
        transactions: monthTransactions,
        transfers: monthTransfers,
        payments: monthPayments,
        charges,
        rate: consolidated.rate,
      }),
    [
      accounts,
      monthTransactions,
      monthTransfers,
      monthPayments,
      charges,
      consolidated.rate,
    ]
  );

  const donutData = useMemo(
    () =>
      computeDonutExpenses({
        payments: monthPayments,
        charges,
        transactions: monthTransactions,
        rate: consolidated.rate,
      }),
    [monthPayments, charges, monthTransactions, consolidated.rate]
  );

  const now = useMemo(() => new Date(), []);

  return {
    accounts,
    charges,
    accountsById,
    chargesById,
    consolidated,
    rate,
    sankeyData,
    donutData,
    monthPayments,
    totalCharges,
    now,
  };
}
