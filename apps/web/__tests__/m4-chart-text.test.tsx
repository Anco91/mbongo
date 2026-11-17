/**
 * M4 — texte dans les graphes (task 4.1/4.2):
 * - sankeyNodeTotals : total par nœud dérivé des liens (max in/out)
 * - donutPercentLabel : « % » positionné hors anneau
 * - DonutCategoriesChart : total au centre (SVG text) par défaut
 *
 * @module Tests/M4/ChartText
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { sankeyNodeTotals } from '@mbongo/shared';
import {
  DonutCategoriesChart,
  donutPercentLabel,
  type DonutDatum,
} from '@/components/common/donut-categories-chart';

describe('sankeyNodeTotals (dérivation pure)', () => {
  it('max(entrants, sortants) par nœud, arrondi 2 décimales', () => {
    // n0 revenu (sortant 3000), n1 compte (entrant 3000, sortant 2495),
    // n2 dépense (entrant 2495), n3 transfert croisé
    const data = {
      nodes: [{ name: 'Salaire' }, { name: 'UBS' }, { name: 'Loyer' }],
      links: [
        { source: 0, target: 1, value: 3000 },
        { source: 1, target: 2, value: 2495.005 },
      ],
    };
    const totals = sankeyNodeTotals(data);
    expect(totals[0]).toBe(3000);
    expect(totals[1]).toBe(3000);
    expect(totals[2]).toBe(2495.01);
  });

  it('somme de plusieurs liens entrants', () => {
    const data = {
      nodes: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      links: [
        { source: 0, target: 2, value: 100 },
        { source: 1, target: 2, value: 50 },
      ],
    };
    expect(sankeyNodeTotals(data)[2]).toBe(150);
  });
});

describe('donutPercentLabel (renderer pur)', () => {
  it('rend le pourcentage arrondi hors anneau', () => {
    const el = donutPercentLabel({
      cx: 100,
      cy: 100,
      midAngle: 0,
      outerRadius: 80,
      percent: 0.345,
    });
    // React element → json snapshot léger : on vérifie le texte
    expect(JSON.stringify(el)).toContain('35 %');
    expect((el.props as { x: number }).x).toBe(100);
  });

  it('percent nul → pas de texte', () => {
    const el = donutPercentLabel({ percent: 0 });
    expect(JSON.stringify(el)).not.toContain('%');
  });
});

const data: DonutDatum[] = [
  { name: 'Logement', value: 1800, color: '#2563eb' },
  { name: 'Médias', value: 335, color: '#f97316' },
];

// ResponsiveContainer ne mesure rien sous jsdom : mock minimal —
// PieChart rend ses enfants verbatim (le <text> du total au centre).
jest.mock('recharts', () => ({
  PieChart: ({
    children,
  }: {
    children: React.ReactNode;
  }) => createElement('svg', null, children),
  Pie: ({ children }: { children: React.ReactNode }) =>
    createElement('g', null, children),
  Cell: (props: Record<string, unknown>) => createElement('path', props),
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    createElement('div', null, children),
}));

describe('DonutCategoriesChart — total au centre', () => {
  it('le total formaté est dans le SVG (par défaut)', () => {
    render(
      createElement(DonutCategoriesChart, {
        data,
        formatValue: (v: number) => `${v.toFixed(2)} €`,
        size: 112,
      })
    );
    expect(screen.getByText('2135.00 €')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
  });

  it('sans données → pas de total', () => {
    render(
      createElement(DonutCategoriesChart, {
        data: [],
        formatValue: (v: number) => `${v.toFixed(2)} €`,
      })
    );
    expect(screen.queryByText('Total')).toBeFalsy();
  });

  it('showPercent false → pas de label % sur les segments', () => {
    render(
      createElement(DonutCategoriesChart, {
        data,
        formatValue: (v: number) => `${v.toFixed(2)} €`,
      })
    );
    expect(screen.queryByText(/%$/)).toBeFalsy();
  });
});
