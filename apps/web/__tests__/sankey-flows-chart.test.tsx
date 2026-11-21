/**
 * Tests for the Sankey card policy — no node text by default, labels only
 * when the renderer asks for them (fullscreen), and a tight card margin.
 *
 * @module Tests/Charts/SankeyFlowsChart
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import type { SankeyNodeProps } from 'recharts';
import {
  SankeyFlowsChart,
  layoutSankeyLabels,
} from '@/components/charts/sankey-flows-chart';
import type { SankeyData } from '@mbongo/shared';

interface CapturedSankeyProps {
  margin: { right: number };
  data: SankeyData;
  node: (props: SankeyNodeProps) => JSX.Element;
}

let captured: CapturedSankeyProps | null = null;

jest.mock('recharts', () => ({
  Sankey: (props: CapturedSankeyProps) => {
    captured = props;
    const nodes = props.data.nodes.map((node, index) =>
      createElement(
        'g',
        { key: index },
        props.node({
          x: 10 + index * 120,
          y: 10 + index * 30,
          width: 8,
          height: 20,
          payload: node,
          index,
        } as unknown as SankeyNodeProps)
      )
    );
    return createElement('svg', null, nodes);
  },
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    createElement('div', null, children),
}));

const data: SankeyData = {
  nodes: [{ name: 'Salaire' }, { name: 'UBS' }, { name: 'Loyer' }],
  links: [
    { source: 0, target: 1, value: 3000 },
    { source: 1, target: 2, value: 2495 },
  ],
};

function renderChart(showLabels?: boolean): ReturnType<typeof render> {
  captured = null;
  return render(
    createElement(SankeyFlowsChart, {
      data,
      formatValue: (value: number) => `${value} €`,
      ...(showLabels === undefined ? {} : { showLabels }),
    })
  );
}

describe('SankeyFlowsChart', () => {
  it('renders no node text in the card by default', () => {
    const { container } = renderChart();
    expect(container.querySelectorAll('text')).toHaveLength(0);
    expect(container.textContent).not.toContain('Salaire');
  });

  it('renders each node name and amount when labels are enabled', () => {
    renderChart(true);
    expect(screen.getByText('Salaire · 3000 €')).toBeTruthy();
    expect(screen.getByText('Loyer · 2495 €')).toBeTruthy();
  });

  it('keeps a tight right margin in the card', () => {
    renderChart();
    expect((captured as unknown as CapturedSankeyProps).margin.right).toBe(16);
  });

  it('shifts colliding labels so two amounts never overlap', () => {
    const placed = layoutSankeyLabels(
      [
        {
          name: 'M1 Verify CHF',
          type: 'income',
          total: 1403.6,
          x: 10,
          y: 100,
          width: 8,
          height: 400,
        },
        {
          name: 'M1 Verify EUR',
          type: 'account',
          total: 1403.6,
          x: 60,
          y: 200,
          width: 8,
          height: 200,
        },
      ],
      (value) => `${value} CHF`
    );

    expect(Math.abs(placed[0].y - placed[1].y)).toBeGreaterThanOrEqual(13);
  });
});
