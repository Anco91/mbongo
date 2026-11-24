/**
 * Dashboard Fullscreen Charts — zoom plein écran Sankey / Donut.
 * Fullscreen carries the text: Sankey node labels and the donut legend.
 *
 * @module Components/Dashboard/DashboardFullscreenCharts
 */

'use client';

import { ChartFullscreen } from '@/components/charts';
import { SankeyFlowsChart } from '@/components/charts/sankey-flows-chart';
import {
  DonutCategoriesChart,
  DonutLegend,
  type DonutDatum,
} from '@/components/charts/donut-categories-chart';
import type { Member, SankeyData } from '@mbongo/shared';
import { MemberScopeChips } from './member-scope-chips';
import { JSX } from 'react';

export type FullscreenChart = 'sankey' | 'donut';

interface DashboardFullscreenChartsProps {
  chart: FullscreenChart;
  sankeyData: SankeyData;
  donutData: DonutDatum[];
  formatValue: (eur: number) => string;
  members: Member[];
  memberId: string | null;
  onMemberChange: (memberId: string | null) => void;
  onClose: () => void;
}

export function DashboardFullscreenCharts({
  chart,
  sankeyData,
  donutData,
  formatValue,
  members,
  memberId,
  onMemberChange,
  onClose,
}: DashboardFullscreenChartsProps): JSX.Element {
  return (
    <ChartFullscreen
      title={
        chart === 'sankey' ? 'Flux du mois (Sankey)' : 'Dépenses par catégorie'
      }
      onClose={onClose}
      toolbar={
        <div className="px-4 py-2">
          <MemberScopeChips
            members={members}
            value={memberId}
            onChange={onMemberChange}
          />
        </div>
      }
    >
      {chart === 'sankey' ? (
        <div className="h-full w-full px-4">
          <SankeyFlowsChart
            data={sankeyData}
            margin={{ top: 20, right: 100, bottom: 20, left: 20 }}
            showLabels
            formatValue={formatValue}
          />
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
          <DonutCategoriesChart
            data={donutData}
            formatValue={formatValue}
            size={360}
          />
          <DonutLegend
            data={donutData}
            formatValue={formatValue}
            layout="wrap"
          />
        </div>
      )}
    </ChartFullscreen>
  );
}
