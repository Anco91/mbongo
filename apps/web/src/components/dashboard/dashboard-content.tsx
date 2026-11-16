/**
 * Dashboard Content Component
 *
 * Implements M3 Dashboard Features (tasks 5.1–5.5):
 * - Consolidated Wealth (dated EUR + parallel CHF)
 * - Monthly Flows (Sankey with fullscreen zoom/pan)
 * - Category Expenses (Donut with legend & fullscreen)
 * - Upcoming Payments of the month with DetailSheet & show more/less
 * - Provisions & Monthly Smoothing with DetailSheet & household total
 * (Alerts moved to the dedicated /alerts view + bell badge — M4.)
 *
 * @module Components/Dashboard/DashboardContent
 */

'use client';

import { useMemo, useState, useEffect, useCallback, JSX } from 'react';
import {
  computeBalance,
  computeConsolidatedBalance,
  computeDonutExpenses,
  computeSankeyFlows,
  monthlyProvision,
  paymentsInMonth,
  paymentDisplayStatus,
  paymentStatusLabel,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useCharges } from '@/hooks/use-charges';
import { usePayments } from '@/hooks/use-schedule';
import { useTransfers } from '@/hooks/use-transfers';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import {
  AccountChip,
  DetailRow,
  DetailSheet,
  ExpandButton,
  SectionTitle,
  StatusBadge,
  ChartFullscreen,
} from '@/components/common';
import { SankeyFlowsChart } from '@/components/common/sankey-flows-chart';
import {
  DonutCategoriesChart,
  DonutLegend,
} from '@/components/common/donut-categories-chart';
import { formatAmount, formatDate } from '@/components/common/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type ChartType = 'sankey' | 'donut';

export function DashboardContent(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState<ChartType | null>(
    null
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: charges = [] } = useCharges();
  const { data: payments = [] } = usePayments();
  const { data: transfers = [] } = useTransfers();
  // Shared display currency + current rate (live official, fallback transfers).
  const { displayCurrency, rate, rateDate, rateSource, convert } =
    useDisplayCurrency();

  /** Formats a EUR-converted value in the display currency (injected in charts). */
  const formatDisplay = useCallback(
    (eurValue: number): string =>
      formatAmount(convert(eurValue), displayCurrency),
    [convert, displayCurrency]
  );

  const accountsById = useMemo(
    () => new Map(accounts.map((acc) => [acc.id, acc])),
    [accounts]
  );

  const chargesById = useMemo(
    () => new Map(charges.map((c) => [c.id, c])),
    [charges]
  );

  // 1. Calcul des soldes par compte
  const balances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const acc of accounts) {
      const accTxs = transactions.filter((t) => t.accountId === acc.id);
      map[acc.id] = computeBalance(acc, accTxs);
    }
    return map;
  }, [accounts, transactions]);

  // 2. Patrimoine consolidé — au taux courant (live prioritaire, fallback transferts)
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

  // 3. Flux Sankey du mois
  const sankeyData = useMemo(
    () =>
      computeSankeyFlows({
        accounts,
        transactions,
        transfers,
        payments,
        charges,
        rate: consolidated.rate,
      }),
    [accounts, transactions, transfers, payments, charges, consolidated.rate]
  );

  // 4. Donut dépenses du mois
  const donutData = useMemo(
    () =>
      computeDonutExpenses({
        payments,
        charges,
        transactions,
        rate: consolidated.rate,
      }),
    [payments, charges, transactions, consolidated.rate]
  );

  const totalDonutValue = useMemo(
    () => donutData.reduce((sum, d) => sum + d.value, 0),
    [donutData]
  );

  // 5. Échéances du mois
  const now = useMemo(() => new Date(), []);
  const monthPayments = useMemo(
    () => paymentsInMonth(payments, now),
    [payments, now]
  );

  const shownPayments = showAllPayments
    ? monthPayments
    : monthPayments.slice(0, 3);

  // 6. Charges provisionnées
  const provisionedCharges = useMemo(
    () => charges.filter((c) => c.provisioned),
    [charges]
  );

  const totalProvisionsMonthly = useMemo(
    () => monthlyProvision(provisionedCharges),
    [provisionedCharges]
  );

  return (
    <div className="space-y-4">
      {/* 1. Patrimoine consolidé */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-xs text-slate-500">
            Patrimoine consolidé
            {consolidated.rateDate &&
              (rateSource === 'live'
                ? ` · au taux du ${formatDate(consolidated.rateDate)} · BCE`
                : ` · dernier taux connu du ${formatDate(consolidated.rateDate)}`)}
          </p>
          <div className="mt-1 flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-slate-900">
                {consolidated.isAvailable && consolidated.totalEur !== null
                  ? formatAmount(
                      convert(consolidated.totalEur),
                      displayCurrency
                    )
                  : 'Taux indisponible'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                ≈{' '}
                {formatAmount(
                  displayCurrency === 'EUR'
                    ? rate && rate > 0
                      ? convert(consolidated.totalEur ?? 0) / rate
                      : (consolidated.totalChf ?? 0)
                    : (consolidated.totalEur ?? 0),
                  displayCurrency === 'EUR' ? 'CHF' : 'EUR'
                )}{' '}
                en parallèle
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Flux du mois (Sankey) */}
      <div>
        <SectionTitle>Flux du mois</SectionTitle>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">
              Revenus → comptes → charges
            </CardTitle>
            <ExpandButton onClick={() => setFullscreenChart('sankey')} />
          </CardHeader>
          <CardContent className="h-56">
            {mounted && sankeyData.nodes.length > 0 ? (
              <SankeyFlowsChart data={sankeyData} />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Aucun flux pour ce mois
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Dépenses par catégorie (Donut) */}
      <div>
        <SectionTitle>Dépenses par catégorie</SectionTitle>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">
              Mois courant ·{' '}
              {formatAmount(convert(totalDonutValue), displayCurrency)}
            </CardTitle>
            <ExpandButton onClick={() => setFullscreenChart('donut')} />
          </CardHeader>
          <CardContent>
            {mounted && donutData.length > 0 ? (
              <div className="flex items-center gap-4">
                <DonutCategoriesChart
                  data={donutData}
                  formatValue={formatDisplay}
                />
                <DonutLegend data={donutData} formatValue={formatDisplay} />
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Aucune dépense catégorisée ce mois-ci
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Échéances du mois */}
      <div>
        <SectionTitle>Échéances du mois</SectionTitle>
        <Card>
          <CardContent className="divide-y divide-slate-100 pt-2">
            {shownPayments.length > 0 ? (
              shownPayments.map((p) => {
                const charge = chargesById.get(p.chargeId);
                const account = charge
                  ? accountsById.get(charge.accountId)
                  : undefined;
                const status = paymentDisplayStatus(p, now);
                const label = charge?.label ?? 'Échéance';

                return (
                  <DetailSheet
                    key={p.id}
                    title={label}
                    trigger={
                      <div className="flex items-center justify-between py-2.5 transition-colors hover:bg-slate-50 cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {label}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            {account && <AccountChip name={account.name} />}
                            <span className="text-[11px] text-slate-400">
                              {formatDate(p.dueDate)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatAmount(p.amount, p.currency)}
                          </span>
                          <StatusBadge status={status} />
                        </div>
                      </div>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status} />
                      {account && <AccountChip name={account.name} />}
                    </div>
                    <Separator />
                    <DetailRow
                      label="Montant"
                      value={formatAmount(p.amount, p.currency)}
                    />
                    <DetailRow label="Échéance" value={formatDate(p.dueDate)} />
                    <DetailRow
                      label="Compte débité"
                      value={account?.name ?? 'Compte inconnu'}
                    />
                    <DetailRow
                      label="Statut"
                      value={paymentStatusLabel(status)}
                    />
                    {charge?.category && (
                      <DetailRow label="Catégorie" value={charge.category} />
                    )}
                  </DetailSheet>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Aucune échéance ce mois-ci
              </div>
            )}

            {monthPayments.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllPayments((v) => !v)}
                className="w-full py-2.5 text-xs font-medium text-emerald-700"
              >
                {showAllPayments
                  ? 'Réduire la liste'
                  : `Afficher les ${monthPayments.length - 3} autres échéances`}
              </button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Provisions · lissage mensuel */}
      <div>
        <SectionTitle>Provisions · lissage mensuel</SectionTitle>
        <Card>
          <CardContent className="space-y-2 pt-4">
            {provisionedCharges.length > 0 ? (
              provisionedCharges.map((c) => {
                const account = accountsById.get(c.accountId);
                const perMonth = c.amount / 12;

                return (
                  <DetailSheet
                    key={c.id}
                    title={c.label}
                    trigger={
                      <div className="flex items-center justify-between rounded-lg px-0 py-2 text-sm transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-slate-800">
                            {c.label}
                          </p>
                          <div className="mt-1">
                            {account && <AccountChip name={account.name} />}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {formatAmount(perMonth, c.currency)} / mois
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatAmount(c.amount, c.currency)} / an
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge status="Provisionnée" />
                      {account && <AccountChip name={account.name} />}
                    </div>
                    <Separator />
                    <DetailRow
                      label="Total annuel"
                      value={formatAmount(c.amount, c.currency)}
                    />
                    <DetailRow
                      label="Lissage mensuel"
                      value={`${formatAmount(perMonth, c.currency)} / mois`}
                    />
                    <DetailRow
                      label="Compte débité"
                      value={account?.name ?? 'Compte inconnu'}
                    />
                  </DetailSheet>
                );
              })
            ) : (
              <div className="py-2 text-center text-xs text-slate-400">
                Aucune charge provisionnée
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                Total provisionné
              </span>
              <span className="font-semibold text-slate-900">
                {formatAmount(totalProvisionsMonthly, 'CHF')} / mois
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. Plein écran charts */}
      {fullscreenChart && (
        <ChartFullscreen
          title={
            fullscreenChart === 'sankey'
              ? 'Flux du mois (Sankey)'
              : 'Dépenses par catégorie'
          }
          onClose={() => setFullscreenChart(null)}
        >
          {fullscreenChart === 'sankey' ? (
            <div className="h-full w-full px-4">
              <SankeyFlowsChart
                data={sankeyData}
                margin={{ top: 20, right: 100, bottom: 20, left: 20 }}
                showLabels
              />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
              <DonutCategoriesChart
                data={donutData}
                formatValue={formatDisplay}
                size={360}
              />
              <DonutLegend
                data={donutData}
                formatValue={formatDisplay}
                layout="wrap"
              />
            </div>
          )}
        </ChartFullscreen>
      )}
    </div>
  );
}
