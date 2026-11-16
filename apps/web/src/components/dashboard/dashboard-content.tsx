/**
 * Dashboard Content Component
 *
 * Implements M3 Dashboard Features (tasks 5.1–5.5):
 * - Consolidated Wealth (dated EUR + parallel CHF)
 * - Financial Alerts Banner (computeAlerts, sorted by severity)
 * - Monthly Flows (Sankey with fullscreen zoom/pan)
 * - Category Expenses (Donut with legend & fullscreen)
 * - Upcoming Payments of the month with DetailSheet & show more/less
 * - Provisions & Monthly Smoothing with DetailSheet & household total
 *
 * @module Components/Dashboard/DashboardContent
 */

'use client';

import { useMemo, useState, useEffect, JSX } from 'react';
import {
  Sankey,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  computeBalance,
  computeConsolidatedBalance,
  computeDonutExpenses,
  computeSankeyFlows,
  computeAlerts,
  monthlyProvision,
  paymentsInMonth,
  paymentDisplayStatus,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useCharges } from '@/hooks/use-charges';
import { usePayments } from '@/hooks/use-schedule';
import { useTransfers } from '@/hooks/use-transfers';
import {
  AccountChip,
  DetailRow,
  DetailSheet,
  ExpandButton,
  SectionTitle,
  StatusBadge,
  ChartFullscreen,
} from '@/components/common';
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

  // 2. Patrimoine consolidé
  const consolidated = useMemo(
    () => computeConsolidatedBalance(accounts, balances, transfers),
    [accounts, balances, transfers]
  );

  // 3. Alertes financières
  const alerts = useMemo(
    () =>
      computeAlerts({
        accounts,
        balances,
        payments,
        charges,
      }),
    [accounts, balances, payments, charges]
  );

  // 4. Flux Sankey du mois
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

  // 5. Donut dépenses du mois
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

  // 6. Échéances du mois
  const now = useMemo(() => new Date(), []);
  const monthPayments = useMemo(
    () => paymentsInMonth(payments, now),
    [payments, now]
  );

  const shownPayments = showAllPayments
    ? monthPayments
    : monthPayments.slice(0, 3);

  // 7. Charges provisionnées
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
      {/* 1. Bandeau d'alertes (si présentes) */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border px-3.5 py-2.5 text-xs ${
                alert.severity === 'danger'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : alert.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                    : 'border-blue-200 bg-blue-50 text-blue-800'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span>{alert.title}</span>
                <span className="uppercase text-[10px] tracking-wider opacity-75">
                  {alert.severity}
                </span>
              </div>
              <p className="mt-0.5 text-slate-600">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* 2. Patrimoine consolidé */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-xs text-slate-500">
            Patrimoine consolidé
            {consolidated.rateDate && (
              <> · au taux du {formatDate(consolidated.rateDate)}</>
            )}
          </p>
          <div className="mt-1 flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-slate-900">
                {consolidated.isAvailable && consolidated.totalEur !== null
                  ? formatAmount(consolidated.totalEur, 'EUR')
                  : 'Taux indisponible'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                ≈ {formatAmount(consolidated.totalChf, 'CHF')} en parallèle
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Flux du mois (Sankey) */}
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
              <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  data={sankeyData}
                  nodeWidth={8}
                  nodePadding={14}
                  margin={{ top: 4, right: 70, bottom: 4, left: 4 }}
                  link={{ stroke: '#94a3b8', strokeOpacity: 0.35 }}
                >
                  <Tooltip />
                </Sankey>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Aucun flux pour ce mois
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Dépenses par catégorie (Donut) */}
      <div>
        <SectionTitle>Dépenses par catégorie</SectionTitle>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">
              Mois courant · {formatAmount(totalDonutValue, 'EUR')}
            </CardTitle>
            <ExpandButton onClick={() => setFullscreenChart('donut')} />
          </CardHeader>
          <CardContent>
            {mounted && donutData.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="h-28 w-28 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        innerRadius="55%"
                        outerRadius="90%"
                        paddingAngle={2}
                        stroke="none"
                      >
                        {donutData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
                  {donutData.map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center gap-1.5 text-[11px] text-slate-600"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="truncate">{d.name}</span>
                      <span className="ml-auto text-slate-400">
                        {formatAmount(d.value, 'EUR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Aucune dépense catégorisée ce mois-ci
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Échéances du mois */}
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
                    <DetailRow label="Statut" value={status} />
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

      {/* 6. Provisions · lissage mensuel */}
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

      {/* 7. Plein écran charts */}
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
              <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  data={sankeyData}
                  nodeWidth={8}
                  nodePadding={14}
                  margin={{ top: 20, right: 100, bottom: 20, left: 20 }}
                  link={{ stroke: '#94a3b8', strokeOpacity: 0.35 }}
                >
                  <Tooltip />
                </Sankey>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4">
              <div className="h-[360px] w-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      innerRadius="55%"
                      outerRadius="90%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {donutData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex max-w-[320px] flex-wrap justify-center gap-x-3 gap-y-1.5">
                {donutData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center gap-1.5 text-[11px] text-slate-600"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span>{d.name}</span>
                    <span className="text-slate-400">
                      {formatAmount(d.value, 'EUR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartFullscreen>
      )}
    </div>
  );
}
