/**
 * Wealth Card — patrimoine consolidé, état du jour (M3, repris M4).
 * The consolidated computation stays in the parent; this component
 * only formats and renders.
 *
 * @module Components/Dashboard/Cards/WealthCard
 */

'use client';

import type {
  ConsolidatedBalance,
  NetWorthTerm,
  WealthView,
} from '@mbongo/shared';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import { formatAmount, formatDate } from '@/lib/format';
import { monthNameLabel } from '@/lib/month-navigation';
import { Card, CardContent } from '@/components/ui/card';
import { JSX } from 'react';

interface WealthCardProps {
  consolidated: ConsolidatedBalance;
  /** Taux courant affiché (pour la conversion parallèle). */
  rate: number | null;
  /** Charges dues du mois courant, EUR (null : inconnu). */
  dueChargesEur: number | null;
  /** Patrimoine net des charges dues, EUR. */
  netOfDueEur: number | null;
  /** Reste à vivre des comptes (hors épargne), EUR. */
  remainingToLiveEur: number | null;
  /** Chiffres du mois choisi (soldes, ou budget seul pour un mois futur). */
  view: WealthView;
  /** Mois du curseur, `YYYY-MM` (libellé « Projeté fin <mois> »). */
  selectedMonth?: string;
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

function FutureBudgetCard({
  view,
  month,
}: {
  view: WealthView;
  month?: string;
}): JSX.Element {
  const { displayCurrency, convert } = useDisplayCurrency();
  const { incomeTotal, chargesTotal, remaining } = view.budget;
  const rows: Array<[string, number, boolean]> = [
    ['Revenus prévus', incomeTotal, false],
    ['Charges prévues', chargesTotal, false],
    ['Reste à vivre (budget)', remaining, true],
  ];
  return (
    <Card className="rounded-xl">
      <CardContent className="pt-5">
        <p className="text-xs text-slate-500">
          Budget de {month ? monthNameLabel(month) : 'ce mois'} · le solde des
          comptes n&apos;est pas connu avant le début du mois
        </p>
        <dl className="mt-2 space-y-1 text-sm text-slate-600">
          {rows.map(([label, amount, strong]) => (
            <div
              key={label}
              className={`flex justify-between ${strong ? 'text-xl font-semibold text-slate-900' : ''}`}
            >
              <dt>{label}</dt>
              <dd className="tabular-nums">
                {formatAmount(convert(amount), displayCurrency)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function WealthCard({
  consolidated,
  rate,
  dueChargesEur,
  netOfDueEur,
  remainingToLiveEur,
  view,
  selectedMonth,
}: WealthCardProps): JSX.Element {
  const { displayCurrency, convert } = useDisplayCurrency();
  const { rateSource } = useDisplayCurrency();
  const { terms } = view;
  const totalEur = view.totalEur;
  const isProjected = view.state !== 'past';
  // Dues, net worth and reste à vivre describe today: shown on the current
  // month only. A past or future month already nets its own charges.
  const showTodayLines = view.state === 'current';

  if (view.kind === 'budget') {
    return <FutureBudgetCard view={view} month={selectedMonth} />;
  }

  return (
    <Card
      tabIndex={0}
      className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      <CardContent className="pt-5">
        <p className="text-xs text-slate-500">
          {isProjected && selectedMonth
            ? `Projeté fin ${monthNameLabel(selectedMonth)}`
            : 'Patrimoine consolidé'}
          {consolidated.rateDate &&
            (rateSource === 'live'
              ? ` · au taux du ${formatDate(consolidated.rateDate)} · BCE`
              : ` · dernier taux connu du ${formatDate(consolidated.rateDate)}`)}
        </p>
        <div className="mt-1 flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {consolidated.isAvailable && totalEur !== null
                ? formatAmount(convert(totalEur), displayCurrency)
                : 'Taux indisponible'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              ≈{' '}
              {formatAmount(
                displayCurrency === 'EUR'
                  ? rate && rate > 0
                    ? convert(totalEur ?? 0) / rate
                    : (consolidated.totalChf ?? 0)
                  : (consolidated.totalEur ?? 0),
                displayCurrency === 'EUR' ? 'CHF' : 'EUR'
              )}{' '}
              en parallèle
            </p>
          </div>
        </div>
        {showTodayLines && dueChargesEur !== null && dueChargesEur > 0 && (
          <dl className="mt-3 space-y-0.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div className="flex justify-between">
              <dt>dont charges dues</dt>
              <dd className="tabular-nums">
                {formatAmount(convert(dueChargesEur), displayCurrency)}
              </dd>
            </div>
            {netOfDueEur !== null && (
              <div className="flex justify-between font-medium text-slate-900">
                <dt>Patrimoine net</dt>
                <dd className="tabular-nums">
                  {formatAmount(convert(netOfDueEur), displayCurrency)}
                </dd>
              </div>
            )}
            {remainingToLiveEur !== null && (
              <div className="flex justify-between">
                <dt>Reste à vivre (comptes)</dt>
                <dd className="tabular-nums">
                  {formatAmount(convert(remainingToLiveEur), displayCurrency)}
                </dd>
              </div>
            )}
          </dl>
        )}
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
