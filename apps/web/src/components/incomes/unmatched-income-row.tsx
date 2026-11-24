/**
 * Unmatched Income Row Component
 *
 * One unmatched transaction and its proposals. Owns the link mutation and
 * the inline error; rules (ranking, gap) come from the domain as-is.
 *
 * @module Components/Incomes/UnmatchedIncomeRow
 */

'use client';

import { type JSX } from 'react';
import type {
  Income,
  IncomeMatchProposal,
  UnmatchedIncome,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useLinkIncome } from '@/hooks/use-incomes';
import { formatAmount, formatDate } from '@/lib/format';
import { AccountChip } from '@/components/ui/account-chip';
import { Button } from '@/components/ui/button';
import { InlineError } from '@/components/patterns/inline-error';

interface UnmatchedIncomeRowProps {
  item: UnmatchedIncome;
  incomes: readonly Income[];
}

function gapLabel(gap: number, currency: string): string {
  if (gap === 0) return 'Montant conforme';
  const sign = gap > 0 ? '+' : '';
  return `Écart ${sign}${formatAmount(gap, currency)}`;
}

export function UnmatchedIncomeRow({
  item,
  incomes,
}: UnmatchedIncomeRowProps): JSX.Element {
  const { data: accounts } = useAccounts();
  const link = useLinkIncome();

  const account = accounts?.find((a) => a.id === item.accountId);
  const currency = account?.currency ?? 'CHF';

  const renderProposal = (
    proposal: IncomeMatchProposal
  ): JSX.Element | null => {
    const income = incomes.find((i) => i.id === proposal.incomeId);
    if (!income) return null;
    return (
      <li
        key={proposal.incomeId}
        className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
      >
        <div className="min-w-0 text-sm">
          <p className="truncate font-medium text-slate-800">{income.label}</p>
          <p className="text-xs text-slate-600">
            Prévu {formatAmount(income.amount, income.currency)} ·{' '}
            {gapLabel(proposal.settlement.gap, income.currency)}
          </p>
        </div>
        <Button
          size="sm"
          disabled={link.isPending}
          onClick={() =>
            link.mutate({
              id: proposal.incomeId,
              input: {
                transactionId: item.transactionId,
                month: item.budgetMonth,
              },
            })
          }
        >
          Lier
        </Button>
      </li>
    );
  };

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">
            {formatDate(item.date)}
          </span>
          {account && <AccountChip name={account.name} />}
        </div>
        <span className="font-semibold text-slate-900">
          {formatAmount(item.amount, currency)}
        </span>
      </div>
      {item.proposals.length === 0 ? (
        <p className="text-sm text-slate-600">
          Aucune source de revenu possible
        </p>
      ) : (
        <ul className="space-y-2">{item.proposals.map(renderProposal)}</ul>
      )}
      {link.error && <InlineError message={link.error.message} />}
    </div>
  );
}
