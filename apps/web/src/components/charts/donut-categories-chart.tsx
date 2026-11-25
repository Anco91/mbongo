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
import {
  formatPercent,
  mergeCategorySegments,
  type SubcategoryExpense,
} from '@mbongo/shared';

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
  /** Part « prévue » (échéances à venir) — rendue en opacité réduite (design D2). */
  planned?: boolean;
  /** Sub-category breakdown shown under the legend row. */
  subcategories?: SubcategoryExpense[];
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

/** Minimum share of a slice to carry an on-slice % label (avoids overlap). */
const MIN_LABEL_SHARE = 0.05;

interface SliceLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  value?: number;
}

function sliceLabel(total: number) {
  return function SliceLabel({
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    value = 0,
  }: SliceLabelProps): JSX.Element | null {
    if (total <= 0 || value / total < MIN_LABEL_SHARE) return null;
    const radius = (innerRadius + outerRadius) / 2;
    const rad = (-midAngle * Math.PI) / 180;
    return (
      <text
        x={cx + radius * Math.cos(rad)}
        y={cy + radius * Math.sin(rad)}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-[10px] font-semibold"
      >
        {formatPercent(value, total)}
      </text>
    );
  };
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
            label={size >= 200 ? sliceLabel(total) : false}
            labelLine={false}
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
          <Tooltip
            formatter={(value) =>
              `${formatValue(Number(value))} · ${formatPercent(Number(value), total)}`
            }
          />
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

interface SubRowsProps {
  subcategories?: SubcategoryExpense[];
  formatValue: (value: number) => string;
}

/** Indented, muted breakdown lines under a category row. */
function SubRows({
  subcategories,
  formatValue,
}: SubRowsProps): JSX.Element | null {
  if (!subcategories?.length) return null;
  return (
    <ul className="mt-0.5 space-y-0.5 pl-3.5 text-[10px] text-slate-400">
      {subcategories.map((sub) => (
        <li key={sub.name} className="flex gap-1.5">
          <span className="truncate">{sub.name}</span>
          <span className="ml-auto">{formatValue(sub.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export function DonutLegend({
  data: rawData,
  formatValue,
  layout = 'grid',
}: DonutLegendProps): JSX.Element {
  const data = mergeCategorySegments(rawData);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (layout === 'grid') {
    return (
      <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
        {data.map((d) => (
          <div key={d.name}>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="truncate">{d.name}</span>
              <span className="ml-auto text-slate-400">
                {formatValue(d.value)} · {formatPercent(d.value, total)}
              </span>
            </div>
            <SubRows
              subcategories={d.subcategories}
              formatValue={formatValue}
            />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex max-w-[320px] flex-wrap justify-center gap-x-3 gap-y-1.5">
      {data.map((d) => (
        <div key={d.name}>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span>{d.name}</span>
            <span className="text-slate-400">
              {formatValue(d.value)} · {formatPercent(d.value, total)}
            </span>
          </div>
          <SubRows subcategories={d.subcategories} formatValue={formatValue} />
        </div>
      ))}
    </div>
  );
}
