/**
 * Tests for the fullscreen chart viewer — it carries the text the card
 * drops: Sankey labels and the donut legend.
 *
 * @module Tests/Dashboard/FullscreenCharts
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { DashboardFullscreenCharts } from '@/components/dashboard/dashboard-fullscreen-charts';
import type { SankeyData } from '@mbongo/shared';

jest.mock('@/components/charts', () => ({
  ChartFullscreen: ({ children }: { children: React.ReactNode }) =>
    createElement('div', null, children),
}));

jest.mock('@/components/charts/sankey-flows-chart', () => ({
  SankeyFlowsChart: ({ showLabels }: { showLabels?: boolean }) =>
    createElement('div', null, showLabels ? 'sankey-labels' : 'sankey-plain'),
}));

jest.mock('@/components/charts/donut-categories-chart', () => ({
  DonutCategoriesChart: () => createElement('div', null, 'donut'),
  DonutLegend: ({
    data,
    formatValue,
  }: {
    data: Array<{ name: string; value: number }>;
    formatValue: (value: number) => string;
  }) =>
    createElement(
      'ul',
      null,
      data.map((datum) =>
        createElement(
          'li',
          { key: datum.name },
          `${datum.name} ${formatValue(datum.value)}`
        )
      )
    ),
}));

const sankeyData: SankeyData = {
  nodes: [{ name: 'Salaire' }],
  links: [],
};
const donutData = [
  { name: 'Logement', value: 1800, color: '#2563eb' },
  { name: 'Médias', value: 335, color: '#f97316' },
];
const formatValue = (value: number): string => `${value} €`;

describe('DashboardFullscreenCharts', () => {
  it('enables the Sankey labels in fullscreen', () => {
    render(
      createElement(DashboardFullscreenCharts, {
        chart: 'sankey',
        sankeyData,
        donutData,
        formatValue,
        onClose: jest.fn(),
      })
    );

    expect(screen.getByText('sankey-labels')).toBeTruthy();
  });

  it('lists every donut category with its amount', () => {
    render(
      createElement(DashboardFullscreenCharts, {
        chart: 'donut',
        sankeyData,
        donutData,
        formatValue,
        onClose: jest.fn(),
      })
    );

    expect(screen.getByText('Logement 1800 €')).toBeTruthy();
    expect(screen.getByText('Médias 335 €')).toBeTruthy();
  });
});
