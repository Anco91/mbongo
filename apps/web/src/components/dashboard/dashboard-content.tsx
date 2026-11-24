/**
 * Dashboard Content Component
 *
 * Composition fine (M4) : orchestration des données (useDashboardData)
 * + état du mois consulté, rendue par des function components dédiés
 * (WealthCard, MonthCursor, SankeyCard, DonutCard, MonthPaymentsCard,
 * ProvisionsCard, DashboardFullscreenCharts). Aucune card ne calcule.
 *
 * @module Components/Dashboard/DashboardContent
 */

'use client';

import { useState, useEffect, useCallback, JSX } from 'react';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import { formatAmount } from '@/lib/format';
import {
  SwipeZone,
  MonthCursor,
  ShowClosedToggle,
} from '@/components/patterns';
import { WealthCard } from './cards/wealth-card';
import { SankeyCard } from './cards/sankey-card';
import { DonutCard } from './cards/donut-card';
import { MonthPaymentsCard } from './cards/month-payments-card';
import { ProvisionsCard } from './cards/provisions-card';
import { BudgetPreparationCard } from './cards/budget-preparation-card';
import {
  DashboardFullscreenCharts,
  type FullscreenChart,
} from './dashboard-fullscreen-charts';
import { currentMonthKey, shiftMonthKey } from '@/lib/month-navigation';
import { useDashboardData } from './use-dashboard-data';
import {
  SkeletonCard,
  SkeletonLine,
  SkeletonList,
} from '@/components/ui/skeleton';

export function DashboardContent(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [fullscreenChart, setFullscreenChart] =
    useState<FullscreenChart | null>(null);
  // Mois consulté (M4, design D3) : curseur « ‹ mois › » + swipe. Le
  // défaut est le mois courant ; le patrimoine et les alertes restent
  // l'état du jour, quel que soit le mois affiché.
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  // Closed accounts are hidden from the charts by default.
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
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
  } = useDashboardData(selectedMonth, showClosed);

  const { displayCurrency, convert } = useDisplayCurrency();

  /** Formate une valeur EUR dans la devise d'affichage (injecté aux charts). */
  const formatDisplay = useCallback(
    (eurValue: number): string =>
      formatAmount(convert(eurValue), displayCurrency),
    [convert, displayCurrency]
  );

  const changeMonth = useCallback(
    (direction: number) =>
      setSelectedMonth((current) => shiftMonthKey(current, direction)),
    []
  );

  return (
    <div className="space-y-4">
      {/* 1. Patrimoine consolidé — état du jour */}
      <WealthCard consolidated={consolidated} rate={rate} />

      {/* Budget preparation card — only for current month */}
      <BudgetPreparationCard
        selectedMonth={selectedMonth}
        totalCharges={totalCharges}
      />

      {/* Curseur mensuel : « ‹ nov. 2026 › » */}
      <MonthCursor selectedMonth={selectedMonth} onChange={setSelectedMonth} />

      {/* 2 + 3 : zone swipe — geste horizontal natif PWA pour changer de mois */}
      <ShowClosedToggle checked={showClosed} onChange={setShowClosed} />

      <SwipeZone onSwipe={changeMonth}>
        {mounted ? (
          <>
            <SankeyCard
              data={sankeyData}
              formatValue={formatDisplay}
              onExpand={() => setFullscreenChart('sankey')}
            />
            <div className="h-4" />
            <DonutCard
              data={donutData}
              formatValue={formatDisplay}
              selectedMonth={selectedMonth}
              onExpand={() => setFullscreenChart('donut')}
            />
          </>
        ) : (
          <DashboardChartsSkeleton />
        )}
      </SwipeZone>

      {/* 4. Échéances du mois choisi */}
      {mounted ? (
        <MonthPaymentsCard
          payments={monthPayments}
          chargesById={chargesById}
          accountsById={accountsById}
          now={now}
        />
      ) : (
        <SkeletonCard lines={0} className="space-y-2">
          <SkeletonLine className="h-3 w-1/3" />
          <SkeletonList rows={3} />
        </SkeletonCard>
      )}

      {/* 5. Charges lissées chaque mois */}
      <ProvisionsCard charges={charges} accountsById={accountsById} />

      {/* 6. Plein écran charts */}
      {fullscreenChart && (
        <DashboardFullscreenCharts
          chart={fullscreenChart}
          sankeyData={sankeyData}
          donutData={donutData}
          formatValue={formatDisplay}
          onClose={() => setFullscreenChart(null)}
        />
      )}
    </div>
  );
}

/** Chart placeholders at the real card height — no layout jump on hydration. */
function DashboardChartsSkeleton(): JSX.Element {
  return (
    <>
      <SkeletonCard lines={0} className="h-72">
        <div className="h-56">
          <SkeletonLine className="h-full w-full rounded-lg" />
        </div>
      </SkeletonCard>
      <div className="h-4" />
      <SkeletonCard lines={0} className="h-72">
        <div className="flex h-56 items-center justify-center">
          <SkeletonLine className="h-40 w-40 rounded-full" />
        </div>
      </SkeletonCard>
    </>
  );
}
