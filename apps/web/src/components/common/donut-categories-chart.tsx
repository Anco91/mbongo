/**
 * Donut Categories Chart — single reusable donut renderer + legend.
 *
 * One component pair for both the dashboard card and the fullscreen
 * viewer: the donut keeps the card/legend colors computed by
 * `computeDonutExpenses`; the value formatting is injected as a pure
 * `formatValue` function (currency conversion stays outside).
 *
 * @module Components/Common/DonutCategoriesChart
 */

'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { type JSX } from 'react';

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

interface DonutCategoriesChartProps {
  data: DonutDatum[];
  /** Formats a EUR-converted value for the display currency. */
  formatValue: (value: number) => string;
  /** Square size in px (112 card · 360 fullscreen). */
  size?: number;
}

export function DonutCategoriesChart({
  data,
  formatValue,
  size = 112,
}: DonutCategoriesChartProps): JSX.Element {
  return (
    <div style={{ width: size, height: size }} className="shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="55%"
            outerRadius="90%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatValue(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutLegendProps {
  data: DonutDatum[];
  formatValue: (value: number) => string;
  /** `grid`: 2 columns flush right (card) · `wrap`: centered flow (fullscreen). */
  layout?: 'grid' | 'wrap';
}

export function DonutLegend({
  data,
  formatValue,
  layout = 'grid',
}: DonutLegendProps): JSX.Element {
  if (layout === 'grid') {
    return (
      <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
        {data.map((d) => (
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
              {formatValue(d.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex max-w-[320px] flex-wrap justify-center gap-x-3 gap-y-1.5">
      {data.map((d) => (
        <div
          key={d.name}
          className="flex items-center gap-1.5 text-[11px] text-slate-600"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: d.color }}
          />
          <span>{d.name}</span>
          <span className="text-slate-400">{formatValue(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
