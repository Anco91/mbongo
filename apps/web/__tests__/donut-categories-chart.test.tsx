/**
 * Tests for the donut card policy — the center total stays, no text is
 * placed on the ring, in card and fullscreen alike.
 *
 * @module Tests/Charts/DonutCategoriesChart
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import {
  DonutCategoriesChart,
  DonutLegend,
  type DonutDatum,
} from '@/components/charts/donut-categories-chart';

jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) =>
    createElement('svg', null, children),
  Pie: ({ children }: { children: React.ReactNode }) =>
    createElement('g', null, children),
  Cell: (props: Record<string, unknown>) => createElement('path', props),
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    createElement('div', null, children),
}));

const data: DonutDatum[] = [
  { name: 'Logement', value: 1800, color: '#2563eb' },
  { name: 'Médias', value: 335, color: '#f97316' },
];

describe('DonutCategoriesChart', () => {
  it('renders no category text on the ring, card or fullscreen', () => {
    const { container } = render(
      createElement(DonutCategoriesChart, {
        data,
        formatValue: (value: number) => `${value} €`,
      })
    );

    const text = Array.from(container.querySelectorAll('text')).map(
      (node) => node.textContent ?? ''
    );
    expect(text.join(' ')).not.toContain('Logement');
    expect(text.join(' ')).not.toContain('Médias');
    expect(text.join(' ')).not.toContain('%');
  });

  it('keeps the total at the center of the ring', () => {
    render(
      createElement(DonutCategoriesChart, {
        data,
        formatValue: (value: number) => `${value} €`,
        size: 360,
      })
    );

    expect(screen.getByText('2135 €')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
  });
});

describe('DonutCategoriesChart — part prévue distincte (tasks 5.3, design D2)', () => {
  const plannedData: DonutDatum[] = [
    { name: 'Logement', value: 1850, color: '#2563eb' },
    { name: 'Logement', value: 1850, color: '#2563eb', planned: true },
  ];

  it('renders the planned segment with reduced opacity and a planned marker', () => {
    const { container } = render(
      createElement(DonutCategoriesChart, {
        data: plannedData,
        formatValue: (value: number) => `${value} €`,
      })
    );

    const cells = Array.from(container.querySelectorAll('path'));
    const planned = cells.find(
      (c) => c.getAttribute('data-planned') === 'true'
    );
    const realized = cells.find((c) => c.getAttribute('data-planned') === null);
    expect(planned).toBeTruthy();
    expect(realized).toBeTruthy();
    expect(planned?.getAttribute('fill-opacity')).toBe('0.45');
    expect(realized?.getAttribute('fill-opacity')).toBe('1');
  });

  it('keeps one legend row per category (planned merged into realized)', () => {
    render(
      createElement(DonutLegend, {
        data: plannedData,
        formatValue: (value: number) => `${value} €`,
      })
    );

    expect(screen.getAllByText('Logement')).toHaveLength(1);
    expect(screen.getByText('3700 €')).toBeTruthy();
  });
});
