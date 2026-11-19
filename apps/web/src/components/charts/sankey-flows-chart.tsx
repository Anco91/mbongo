/**
 * Sankey Flows Chart — single reusable Sankey renderer.
 *
 * One component for both the dashboard card and the fullscreen viewer:
 * nodes and links are colored by type (income = green, accounts = blue,
 * expenses = orange), links inherit their source node color at 50 %
 * opacity. Classification is a pure function; the renderers are pure
 * functions of their props.
 *
 * @module Components/Common/SankeyFlowsChart
 */

'use client';

import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import type { SankeyNodeProps, SankeyLinkProps } from 'recharts';
import {
  sankeyNodeTotals,
  type SankeyData,
  type SankeyLink,
  type SankeyNode,
} from '@mbongo/shared';
import { useCallback, useMemo, type JSX } from 'react';

export type SankeyNodeType = 'income' | 'account' | 'expense';

/** Palette cohérente avec le donut (revenus verts, comptes bleus, dépenses oranges). */
const NODE_COLORS: Record<SankeyNodeType, string> = {
  income: '#059669',
  account: '#2563eb',
  expense: '#f97316',
};

/**
 * Classe chaque nœud par son degré (liens entrants/sortants) :
 * - seulement sortant → revenu ;
 * - entrant et sortant → compte ;
 * - seulement entrant → dépense.
 */
export function classifySankeyNodes(
  nodes: SankeyNode[],
  links: SankeyLink[]
): SankeyNodeType[] {
  const incoming = new Array<number>(nodes.length).fill(0);
  const outgoing = new Array<number>(nodes.length).fill(0);
  for (const link of links) {
    outgoing[link.source] += 1;
    incoming[link.target] += 1;
  }
  return nodes.map((_, i) => {
    if (incoming[i] === 0 && outgoing[i] > 0) return 'income';
    if (incoming[i] > 0 && outgoing[i] > 0) return 'account';
    return 'expense';
  });
}

/** Couleur d'un type de nœud (palette unique carte + plein écran). */
export function sankeyNodeColor(type: SankeyNodeType): string {
  return NODE_COLORS[type];
}

interface NodeRenderOptions {
  types: SankeyNodeType[];
  totals: number[];
  formatValue: (value: number) => string;
  showLabels: boolean;
}

/** Pure renderer: colored node rect + always-on « nom · montant » label. */
function renderSankeyNode(
  props: SankeyNodeProps,
  options: NodeRenderOptions
): JSX.Element {
  const { x, y, width, height, payload, index } = props;
  const type = options.types[index] ?? 'account';
  const fill = sankeyNodeColor(type);
  const total = options.totals[index] ?? 0;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />
      {options.showLabels && payload?.name && (
        <text
          x={type === 'income' ? x + width + 4 : x - 4}
          y={y + height / 2}
          dy="0.32em"
          textAnchor={type === 'income' ? 'start' : 'end'}
          className="fill-slate-500 text-[10px]"
        >
          {`${payload.name} · ${options.formatValue(total)}`}
        </text>
      )}
    </g>
  );
}

/** Pure renderer: link path colored by its source node type. */
function renderSankeyLink(
  props: SankeyLinkProps,
  typesByName: Record<string, SankeyNodeType>
): JSX.Element {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    payload,
  } = props;
  const color = sankeyNodeColor(
    typesByName[payload?.source?.name ?? ''] ?? 'account'
  );

  const d = `M${sourceX},${sourceY}C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`;

  return (
    <path
      d={d}
      stroke={color}
      strokeOpacity={0.5}
      strokeWidth={Math.max(linkWidth, 1)}
      fill="none"
    />
  );
}

interface SankeyFlowsChartProps {
  data: SankeyData;
  /** Sankey margins (card: tight; fullscreen: wider). */
  margin?: { top: number; right: number; bottom: number; left: number };
  /** Node labels « nom · montant ». Card: off (hover only). Fullscreen: on. */
  showLabels?: boolean;
  /** Formateur de montant (devise d'affichage, injecté par le dashboard). */
  formatValue?: (value: number) => string;
}

export function SankeyFlowsChart({
  data,
  margin = { top: 4, right: 16, bottom: 4, left: 4 },
  showLabels = false,
  formatValue = (value: number) => String(Math.round(value)),
}: SankeyFlowsChartProps): JSX.Element {
  const types = useMemo(
    () => classifySankeyNodes(data.nodes, data.links),
    [data]
  );
  // Node order is preserved by the layout; names are unique (dedup in computeSankeyFlows).
  const typesByName = useMemo(() => {
    const map: Record<string, SankeyNodeType> = {};
    data.nodes.forEach((node, i) => {
      map[node.name] = types[i];
    });
    return map;
  }, [data, types]);

  const totals = useMemo(() => sankeyNodeTotals(data), [data]);

  const node = useCallback(
    (props: SankeyNodeProps) =>
      renderSankeyNode(props, {
        types,
        totals,
        formatValue,
        showLabels,
      }),
    [types, totals, formatValue, showLabels]
  );
  const link = useCallback(
    (props: SankeyLinkProps) => renderSankeyLink(props, typesByName),
    [typesByName]
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Sankey
        data={data}
        nodeWidth={8}
        nodePadding={14}
        margin={margin}
        node={node}
        link={link}
      >
        <Tooltip />
      </Sankey>
    </ResponsiveContainer>
  );
}
