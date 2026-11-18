/**
 * Donut Card — Dépenses par catégorie du mois choisi (M3, repris M4).
 * Le total est au centre de l'anneau (design D5) ; la légende reste
 * en plein écran uniquement.
 *
 * @module Components/Dashboard/DonutCard
 */

'use client';

import { SectionTitle, ExpandButton } from '@/components/common';
import {
  DonutCategoriesChart,
  type DonutDatum,
} from '@/components/common/donut-categories-chart';
import { formatAmount } from '@/components/common/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import { monthLabel } from '@/lib/month-navigation';
import { JSX } from 'react';

interface DonutCardProps {
  data: DonutDatum[];
  formatValue: (eur: number) => string;
  selectedMonth: string;
  onExpand: () => void;
}

export function DonutCard({
  data,
  formatValue,
  selectedMonth,
  onExpand,
}: DonutCardProps): JSX.Element {
  const { displayCurrency, convert } = useDisplayCurrency();
  const totalEur = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <SectionTitle>Dépenses par catégorie</SectionTitle>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium text-slate-500">
            {monthLabel(selectedMonth)} ·{' '}
            {formatAmount(convert(totalEur), displayCurrency)}
          </CardTitle>
          <ExpandButton onClick={onExpand} />
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="flex justify-center">
              <DonutCategoriesChart data={data} formatValue={formatValue} />
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              Aucune dépense catégorisée ce mois-ci
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
