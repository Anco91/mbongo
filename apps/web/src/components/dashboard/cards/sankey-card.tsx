/**
 * Sankey Card — Flux du mois (M3, repris M4 mensuel).
 * Pure presentation: data + formatters injected by the parent.
 *
 * @module Components/Dashboard/Cards/SankeyCard
 */

'use client';

import { SectionTitle, ExpandButton } from '@/components/patterns';
import { SankeyFlowsChart } from '@/components/charts/sankey-flows-chart';
import type { SankeyData } from '@mbongo/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { JSX } from 'react';

interface SankeyCardProps {
  data: SankeyData;
  formatValue: (eur: number) => string;
  onExpand: () => void;
}

export function SankeyCard({
  data,
  formatValue,
  onExpand,
}: SankeyCardProps): JSX.Element {
  return (
    <div>
      <SectionTitle>Flux du mois</SectionTitle>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-slate-500">
            Revenus → comptes → charges
          </CardTitle>
          <ExpandButton onClick={onExpand} />
        </CardHeader>
        <CardContent className="h-56">
          {data.nodes.length > 0 ? (
            <SankeyFlowsChart data={data} formatValue={formatValue} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Aucun flux pour ce mois
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
