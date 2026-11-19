/**
 * Tests for the Sankey card policy — no node text by default, labels only
 * when the renderer asks for them (fullscreen), and a tight card margin.
 *
 * @module Tests/Charts/SankeyFlowsChart
 */

import { render } from '@testing-library/react';
import { createElement } from 'react';
import type { SankeyNodeProps } from 'recharts';
import { SankeyFlowsChart } from '@/components/charts/sankey-flows-chart';
import type { SankeyData } from '@mbongo/shared';

interface CapturedSankeyProps {
  margin: { right: number };
  node: (props: SankeyNodeProps) => JSX.Element;
}

let captured: CapturedSankeyProps | null = null;

jest.mock('recharts', () => ({
  Sankey: (props: CapturedSankeyProps) => {
    captured = props;
    return createElement('svg');
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

const nodeProps = {
  x: 0,
  y: 10,
  width: 8,
  height: 40,
  payload: { name: 'Salaire' },
  index: 0,
} as unknown as SankeyNodeProps;

function textCount(showLabels?: boolean): number {
  captured = null;
  render(
    createElement(SankeyFlowsChart, {
      data,
      formatValue: (value: number) => `${value} €`,
      ...(showLabels === undefined ? {} : { showLabels }),
    })
  );
  const node = (captured as unknown as CapturedSankeyProps).node(nodeProps);
  return JSON.stringify(node).split('"text"').length - 1;
}

describe('SankeyFlowsChart', () => {
  it('renders no node text in the card by default', () => {
    expect(textCount()).toBe(0);
  });

  it('renders the node name and amount when labels are enabled', () => {
    const rendered = textCount(true);
    expect(rendered).toBeGreaterThan(0);
  });

  it('keeps a tight right margin in the card', () => {
    render(createElement(SankeyFlowsChart, { data }));
    expect((captured as unknown as CapturedSankeyProps).margin.right).toBe(16);
  });
});
