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
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from 'react';

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

/** Pure renderer: colored node rect. Text is laid out separately (see below). */
function renderSankeyNode(
  props: SankeyNodeProps,
  typesByName: Record<string, SankeyNodeType>
): JSX.Element {
  const { x, y, width, height, payload } = props;
  const name = payload?.name ?? '';
  const fill = sankeyNodeColor(typesByName[name] ?? 'account');

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx={2}
        data-sankey-node={name}
      />
    </g>
  );
}

/** Boîte d'un nœud rendu par le layout Sankey, en coordonnées du graphe. */
export interface SankeyLabelNode {
  name: string;
  type: SankeyNodeType;
  total: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Libellé « nom · montant » avec une position verticale sans chevauchement. */
export interface SankeyLabelPlacement {
  key: number;
  text: string;
  anchor: 'start' | 'end';
  anchorX: number;
  y: number;
  width: number;
}

const LABEL_FONT_PX = 10;
const LABEL_LINE_PX = 13;
/** Estimation de la largeur d'un libellé à 10 px (assez large pour éviter les collisions). */
const LABEL_CHAR_PX = 5.6;

function horizontalRange(label: {
  anchor: 'start' | 'end';
  anchorX: number;
  width: number;
}): { left: number; right: number } {
  return label.anchor === 'start'
    ? { left: label.anchorX, right: label.anchorX + label.width }
    : { left: label.anchorX - label.width, right: label.anchorX };
}

/**
 * Place chaque libellé au centre de son nœud. Quand deux libellés proches se
 * chevaucheraient (même colonne ou colonnes voisines sur mobile), le second
 * descend d'une ligne : aucun texte ne se superpose, même à 390 px.
 */
export function layoutSankeyLabels(
  nodes: SankeyLabelNode[],
  formatValue: (value: number) => string
): SankeyLabelPlacement[] {
  const labels: SankeyLabelPlacement[] = nodes.map((node, key) => {
    const text = `${node.name} · ${formatValue(node.total)}`;
    const anchor = node.type === 'income' ? 'start' : 'end';
    const width = Math.ceil(text.length * LABEL_CHAR_PX);
    const anchorX = anchor === 'start' ? node.x + node.width + 4 : node.x - 4;
    // Un libellé ne doit pas sortir du bord gauche du graphe.
    const left = anchor === 'start' ? anchorX : anchorX - width;
    const shift = Math.max(0, 2 - left);
    return {
      key,
      text,
      anchor,
      anchorX: anchorX + shift,
      y: node.y + node.height / 2,
      width,
    };
  });

  const placed: SankeyLabelPlacement[] = [];
  for (const label of [...labels].sort((a, b) => a.y - b.y)) {
    const range = horizontalRange(label);
    let y = label.y;
    for (let guard = 0; guard < 200; guard += 1) {
      const collision = placed.find((other) => {
        const otherRange = horizontalRange(other);
        const overlapsX =
          Math.min(range.right, otherRange.right) -
            Math.max(range.left, otherRange.left) >
          2;
        return overlapsX && Math.abs(other.y - y) < LABEL_LINE_PX;
      });
      if (!collision) break;
      y = collision.y + LABEL_LINE_PX;
    }
    placed.push({ ...label, y });
  }
  return placed;
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
  const totalsByName = useMemo(() => {
    const map: Record<string, number> = {};
    data.nodes.forEach((node, i) => {
      map[node.name] = totals[i] ?? 0;
    });
    return map;
  }, [data, totals]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [labels, setLabels] = useState<SankeyLabelPlacement[]>([]);
  const [resizeTick, setResizeTick] = useState(0);

  const node = useCallback(
    (props: SankeyNodeProps) => renderSankeyNode(props, typesByName),
    [typesByName]
  );
  const link = useCallback(
    (props: SankeyLinkProps) => renderSankeyLink(props, typesByName),
    [typesByName]
  );

  useEffect(() => {
    if (!showLabels) {
      setLabels((current) => (current.length === 0 ? current : []));
      return;
    }
    const root = containerRef.current;
    if (!root) return;
    // Read the laid-out rects: their coordinates are the ones actually painted,
    // whatever provisional size ResponsiveContainer used on first render.
    const nodes: SankeyLabelNode[] = Array.from(
      root.querySelectorAll<SVGRectElement>('[data-sankey-node]')
    ).flatMap((rect) => {
      const name = rect.getAttribute('data-sankey-node') ?? '';
      if (!name) return [];
      return [
        {
          name,
          type: typesByName[name] ?? 'account',
          total: totalsByName[name] ?? 0,
          x: Number(rect.getAttribute('x')),
          y: Number(rect.getAttribute('y')),
          width: Number(rect.getAttribute('width')),
          height: Number(rect.getAttribute('height')),
        },
      ];
    });
    setLabels(layoutSankeyLabels(nodes, formatValue));
  }, [showLabels, data, typesByName, totalsByName, formatValue, resizeTick]);

  useEffect(() => {
    if (!showLabels) return undefined;
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      // Wait for the chart to re-layout at the measured size before reading rects.
      requestAnimationFrame(() => setResizeTick((tick) => tick + 1));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [showLabels]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
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
      {showLabels &&
        labels.map((label) => (
          <span
            key={label.key}
            className="pointer-events-none absolute whitespace-nowrap font-medium text-slate-600"
            style={{
              left: label.anchorX,
              top: label.y,
              fontSize: LABEL_FONT_PX,
              lineHeight: `${LABEL_LINE_PX}px`,
              textShadow:
                '0 0 2px rgba(255, 255, 255, 0.95), 0 0 3px rgba(255, 255, 255, 0.95)',
              transform: `translate(${label.anchor === 'end' ? '-100%' : '0'}, -50%)`,
            }}
          >
            {label.text}
          </span>
        ))}
    </div>
  );
}
