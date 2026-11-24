/**
 * Wealth Card — patrimoine consolidé, état du jour (M3, repris M4).
 * The consolidated computation stays in the parent; this component
 * only formats and renders.
 *
 * @module Components/Dashboard/Cards/WealthCard
 */

'use client';

import type { ConsolidatedBalance, NetWorthTerm } from '@mbongo/shared';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import { formatAmount, formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { JSX } from 'react';

interface WealthCardProps {
  consolidated: ConsolidatedBalance;
  /** Taux courant affiché (pour la conversion parallèle). */
  rate: number | null;
  /** Termes du patrimoine (un par compte actif), détaillés au survol/focus. */
  terms: NetWorthTerm[];
}

function NetWorthTermRow({ term }: { term: NetWorthTerm }): JSX.Element {
  const isOverdraft = term.kind === 'overdraft';
  return (
    <li className="flex items-baseline gap-1.5">
      <span aria-hidden="true">{isOverdraft ? '−' : '+'}</span>
      <span className="tabular-nums">
        {formatAmount(Math.abs(term.balance), term.currency)}
      </span>
      <span className="truncate">
        {term.name}
        {isOverdraft && ' découvert'}
      </span>
    </li>
  );
}

export function WealthCard({
  consolidated,
  rate,
  terms,
}: WealthCardProps): JSX.Element {
  const { displayCurrency, convert } = useDisplayCurrency();
  const { rateSource } = useDisplayCurrency();

  return (
    <Card
      tabIndex={0}
      className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
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
        {terms.length > 0 && (
          <ul
            aria-label="Détail du patrimoine"
            className="mt-3 hidden space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600 group-focus-within:block group-hover:block"
          >
            {terms.map((term) => (
              <NetWorthTermRow key={term.accountId} term={term} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
