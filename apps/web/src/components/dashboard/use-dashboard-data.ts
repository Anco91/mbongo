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
  excludeClosedAccounts,
  listNetWorthTerms,
  scopeToMember,
  computeMonthlyBudget,
  computeDueCharges,
  computeNetOfDue,
  computeRemainingToLive,
  monthRange,
  isInMonth,
  type Account,
  type Charge,
  type Payment,
  type Transaction,
  type CategoryExpense,
  type NetWorthTerm,
  type SankeyData,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useCharges } from '@/hooks/use-charges';
import { useMonthPayments } from '@/hooks/use-schedule';
import { useTransfers } from '@/hooks/use-transfers';
import { useIncomes } from '@/hooks/use-incomes';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import { currentMonthKey, monthKeyToDate } from '@/lib/month-navigation';

interface DashboardData {
  accounts: Account[];
  charges: Charge[];
  accountsById: Map<string, Account>;
  chargesById: Map<string, Charge>;
  consolidated: ReturnType<typeof computeConsolidatedBalance>;
  rate: number | null;
  netWorthTerms: NetWorthTerm[];
  sankeyData: SankeyData;
  donutData: CategoryExpense[];
  /** Same charts narrowed to the member/account scope (fullscreen only). */
  scopedSankeyData: SankeyData;
  scopedDonutData: CategoryExpense[];
  monthPayments: Payment[];
  /** Total charges for the selected month (for BudgetPreparationCard). */
  totalCharges: number;
  /** Unpaid, non-provisioned charges of the current month, EUR (null: rate missing). */
  dueChargesEur: number | null;
  /** Net worth minus due charges, EUR. */
  netOfDueEur: number | null;
  /** Non-savings account balances minus due charges, EUR. */
  remainingToLiveEur: number | null;
  now: Date;
}

type ChartScope = ReturnType<typeof scopeToMember>;

interface Charts {
  sankeyData: SankeyData;
  donutData: CategoryExpense[];
}

/** Sankey + donut of one scope; confirmed incomes match on budgetMonth, so
 * income-linked transactions of other months are added (positive only). */
function buildCharts(
  scope: ChartScope,
  allTransactions: Transaction[],
  monthKey: string,
  rate: number | null
): Charts {
  const inScope = new Set(scope.accounts.map((a) => a.id));
  const inMonth = new Set(scope.transactions.map((t) => t.id));
  const linked = allTransactions.filter(
    (t) =>
      t.incomeId &&
      t.amount > 0 &&
      !inMonth.has(t.id) &&
      inScope.has(t.accountId)
  );
  return {
    sankeyData: computeSankeyFlows({
      ...scope,
      transactions: [...scope.transactions, ...linked],
      incomes: scope.incomes ?? [],
      monthKey,
      rate,
    }),
    donutData: computeDonutExpenses({
      payments: scope.payments,
      charges: scope.charges,
      transactions: scope.transactions,
      rate,
    }),
  };
}

export function useDashboardData(
  selectedMonth: string,
  showClosed = false,
  memberId: string | null = null,
  accountId: string | null = null
): DashboardData {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: charges = [] } = useCharges();
  // Échéances requêtées pour le mois choisi (fenêtre dueDate, design D5) —
  // la même requête que le prefetch serveur du guard.
  const { data: payments = [] } = useMonthPayments(selectedMonth);
  // Charges dues : toujours le mois courant, indépendamment du curseur.
  const { data: currentPayments = [] } = useMonthPayments(currentMonthKey());
  const { data: transfers = [] } = useTransfers();
  const { data: incomes = [] } = useIncomes();
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

  // Termes du patrimoine (détail au survol de la carte).
  const netWorthTerms = useMemo(
    () => listNetWorthTerms(accounts, balances),
    [accounts, balances]
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

  // La requête est déjà fenêtrée sur le mois choisi — plus de filtre local.
  const monthPayments = payments;

  // Total charges for the selected month (for BudgetPreparationCard).
  // Uses computeMonthlyBudget with the month's payments to get the correct total.
  const totalCharges = useMemo(() => {
    const monthDate = monthKeyToDate(selectedMonth);
    const { total } = computeMonthlyBudget(charges, payments, monthDate);
    return total;
  }, [charges, payments, selectedMonth]);

  // Charts only: closed accounts (and what points at them) are hidden unless
  // asked for. Balances, consolidated and totalCharges stay untouched.
  const closedScope = useMemo(
    () =>
      showClosed
        ? {
            accounts,
            transactions: monthTransactions,
            transfers: monthTransfers,
            charges,
            payments: monthPayments,
            incomes,
          }
        : excludeClosedAccounts({
            accounts,
            transactions: monthTransactions,
            transfers: monthTransfers,
            charges,
            payments: monthPayments,
            incomes,
          }),
    [
      showClosed,
      accounts,
      monthTransactions,
      monthTransfers,
      charges,
      monthPayments,
      incomes,
    ]
  );

  // Page cards are always household; the fullscreen view applies the member
  // scope (same closed-accounts filter, no second fetch).
  const pageCharts = useMemo(
    () =>
      buildCharts(closedScope, transactions, selectedMonth, consolidated.rate),
    [closedScope, transactions, selectedMonth, consolidated.rate]
  );
  const scopedCharts = useMemo(
    () =>
      memberId === null
        ? pageCharts
        : buildCharts(
            scopeToMember(closedScope, memberId, accountId),
            transactions,
            selectedMonth,
            consolidated.rate
          ),
    [
      pageCharts,
      closedScope,
      memberId,
      accountId,
      transactions,
      selectedMonth,
      consolidated.rate,
    ]
  );

  const now = useMemo(() => new Date(), []);

  const dueChargesEur = useMemo(
    () => computeDueCharges(currentPayments, charges, now, rate),
    [currentPayments, charges, now, rate]
  );
  const netOfDueEur = useMemo(
    () => computeNetOfDue(consolidated, dueChargesEur),
    [consolidated, dueChargesEur]
  );
  const remainingToLiveEur = useMemo(
    () => computeRemainingToLive(accounts, balances, dueChargesEur, rate),
    [accounts, balances, dueChargesEur, rate]
  );

  return {
    accounts,
    charges,
    accountsById,
    chargesById,
    consolidated,
    rate,
    netWorthTerms,
    sankeyData: pageCharts.sankeyData,
    donutData: pageCharts.donutData,
    scopedSankeyData: scopedCharts.sankeyData,
    scopedDonutData: scopedCharts.donutData,
    monthPayments,
    totalCharges,
    dueChargesEur,
    netOfDueEur,
    remainingToLiveEur,
    now,
  };
}
