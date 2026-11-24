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
  /** Part « prévue » (échéances à venir) — rendue en opacité réduite (design D2). */
  planned?: boolean;
}

interface DonutCategoriesChartProps {
  data: DonutDatum[];
  /** Formats a EUR-converted value for the display currency. */
  formatValue: (value: number) => string;
  /** Square size in px (112 card · 360 fullscreen). */
  size?: number;
  /** Total au centre de l'anneau (M4, design D5 — défaut : oui). */
  showCenterTotal?: boolean;
}

export function DonutCategoriesChart({
  data,
  formatValue,
  size = 112,
  showCenterTotal = true,
}: DonutCategoriesChartProps): JSX.Element {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const centerFont = size >= 200 ? 'text-lg' : 'text-[11px]';
  const centerLabelFont = size >= 200 ? 'text-[11px]' : 'text-[8px]';

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
              <Cell
                key={`${d.name}-${d.planned ? 'planned' : 'realized'}`}
                fill={d.color}
                fillOpacity={d.planned ? 0.45 : 1}
                data-planned={d.planned ? 'true' : undefined}
              />
            ))}
          </Pie>
          {showCenterTotal && total > 0 && (
            <text
              x="50%"
              y="46%"
              textAnchor="middle"
              dominantBaseline="central"
              className={`fill-slate-900 ${centerFont} font-semibold`}
            >
              {formatValue(total)}
            </text>
          )}
          {showCenterTotal && total > 0 && (
            <text
              x="50%"
              y="60%"
              textAnchor="middle"
              dominantBaseline="central"
              className={`fill-slate-400 ${centerLabelFont}`}
            >
              Total
            </text>
          )}
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

/** One legend row per category: the planned and realized shares merge. */
function mergeLegendRows(data: DonutDatum[]): DonutDatum[] {
  const merged = new Map<string, DonutDatum>();
  for (const d of data) {
    const existing = merged.get(d.name);
    if (existing) {
      merged.set(d.name, { ...existing, value: existing.value + d.value });
    } else {
      merged.set(d.name, { ...d });
    }
  }
  return [...merged.values()];
}

export function DonutLegend({
  data: rawData,
  formatValue,
  layout = 'grid',
}: DonutLegendProps): JSX.Element {
  const data = mergeLegendRows(rawData);
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
