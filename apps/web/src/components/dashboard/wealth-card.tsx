/**
 * Wealth Card — patrimoine consolidé, état du jour (M3, repris M4).
 * The consolidated computation stays in the parent; this component
 * only formats and renders.
 *
 * @module Components/Dashboard/WealthCard
 */

'use client';

import type { ConsolidatedBalance } from '@mbongo/shared';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import { formatAmount, formatDate } from '@/components/common/format';
import { Card, CardContent } from '@/components/ui/card';
import { JSX } from 'react';

interface WealthCardProps {
  consolidated: ConsolidatedBalance;
  /** Taux courant affiché (pour la conversion parallèle). */
  rate: number | null;
}

export function WealthCard({
  consolidated,
  rate,
}: WealthCardProps): JSX.Element {
  const { displayCurrency, convert } = useDisplayCurrency();
  const { rateSource } = useDisplayCurrency();

  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs text-slate-500">
          Patrimoine consolidé
          {consolidated.rateDate &&
            (rateSource === 'live'
              ? ` · au taux du ${formatDate(consolidated.rateDate)} · BCE`
              : ` · dernier taux connu du ${formatDate(consolidated.rateDate)}`)}
        </p>
        <div className="mt-1 flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {consolidated.isAvailable && consolidated.totalEur !== null
                ? formatAmount(convert(consolidated.totalEur), displayCurrency)
                : 'Taux indisponible'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              ≈{' '}
              {formatAmount(
                displayCurrency === 'EUR'
                  ? rate && rate > 0
                    ? convert(consolidated.totalEur ?? 0) / rate
                    : (consolidated.totalChf ?? 0)
                  : (consolidated.totalEur ?? 0),
                displayCurrency === 'EUR' ? 'CHF' : 'EUR'
              )}{' '}
              en parallèle
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
