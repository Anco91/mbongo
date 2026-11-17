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
import { formatAmount } from '@/components/common/format';
import { SwipeZone, MonthCursor } from '@/components/common';
import { WealthCard } from './wealth-card';
import { SankeyCard } from './sankey-card';
import { DonutCard } from './donut-card';
import { MonthPaymentsCard } from './month-payments-card';
import { ProvisionsCard } from './provisions-card';
import {
  DashboardFullscreenCharts,
  type FullscreenChart,
} from './dashboard-fullscreen-charts';
import {
  currentMonthKey,
  shiftMonthKey,
} from '@/lib/month-navigation';
import { useDashboardData } from './use-dashboard-data';

export function DashboardContent(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [fullscreenChart, setFullscreenChart] = useState<FullscreenChart | null>(
    null
  );
  // Mois consulté (M4, design D3) : curseur « ‹ mois › » + swipe. Le
  // défaut est le mois courant ; le patrimoine et les alertes restent
  // l'état du jour, quel que soit le mois affiché.
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

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
    now,
  } = useDashboardData(selectedMonth);

  const { displayCurrency, convert } = useDisplayCurrency();

  /** Formate une valeur EUR dans la devise d'affichage (injecté aux charts). */
  const formatDisplay = useCallback(
    (eurValue: number): string =>
      formatAmount(convert(eurValue), displayCurrency),
    [convert, displayCurrency]
  );

  // Avant hydratation : données vides (les cards affichent leur état vide).
  const viewData = mounted
    ? { sankeyData, donutData, monthPayments }
    : {
        sankeyData: { nodes: [], links: [] },
        donutData: [],
        monthPayments: [],
      };

  const changeMonth = useCallback(
    (direction: number) =>
      setSelectedMonth((current) => shiftMonthKey(current, direction)),
    []
  );

  return (
    <div className="space-y-4">
      {/* 1. Patrimoine consolidé — état du jour */}
      <WealthCard consolidated={consolidated} rate={rate} />

      {/* Curseur mensuel : « ‹ nov. 2026 › » */}
      <MonthCursor selectedMonth={selectedMonth} onChange={setSelectedMonth} />

      {/* 2 + 3 : zone swipe — geste horizontal natif PWA pour changer de mois */}
      <SwipeZone onSwipe={changeMonth}>
        <SankeyCard
          data={viewData.sankeyData}
          formatValue={formatDisplay}
          onExpand={() => setFullscreenChart('sankey')}
        />
        <div className="h-4" />
        <DonutCard
          data={viewData.donutData}
          formatValue={formatDisplay}
          selectedMonth={selectedMonth}
          onExpand={() => setFullscreenChart('donut')}
        />
      </SwipeZone>

      {/* 4. Échéances du mois choisi */}
      <MonthPaymentsCard
        payments={viewData.monthPayments}
        chargesById={chargesById}
        accountsById={accountsById}
        now={now}
      />

      {/* 5. Provisions · lissage mensuel */}
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
