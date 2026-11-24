/**
 * Account Card — one tappable account summary: name, bank/currency, owner,
 * type badge, balance, savings progress and card encours. Presentation only
 * (design D5); the view model comes from `buildAccountCards`.
 *
 * @module Components/Accounts/AccountCard
 */

import { JSX } from 'react';
import Link from 'next/link';
import { OwnerBadge } from '@/components/patterns';
import { formatAmount } from '@/lib/format';
import { ACCOUNT_TYPE_LABELS, type AccountCardView } from '@/lib/accounts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AccountCardProps {
  view: AccountCardView;
}

export function AccountCard({ view }: AccountCardProps): JSX.Element {
  const { account, status, balance, savingsProgress, billing, settlementName } =
    view;

  return (
    <Link href={`/accounts/${account.id}/edit`} className="block">
      <Card className="cursor-pointer border-slate-200 transition-colors hover:border-slate-300">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {account.name}
              </p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {account.bank ?? '—'} · {account.currency}
              </p>
            </div>
            <OwnerBadge memberId={account.memberId} />
            <Badge variant="outline" className="text-[10px] text-slate-500">
              {ACCOUNT_TYPE_LABELS[account.accountType] ?? account.accountType}
            </Badge>
            {status === 'CLOSED' && (
              <Badge variant="outline" className="text-[10px] text-slate-500">
                Clôturé
              </Badge>
            )}
          </div>
          <p
            className={`mt-2 text-lg font-semibold ${
              balance < 0 ? 'text-red-600' : 'text-slate-900'
            }`}
          >
            {formatAmount(balance, account.currency)}
          </p>
          {savingsProgress !== null && (
            <div className="mt-2 flex items-center gap-2">
              <Progress value={savingsProgress} className="h-1.5" />
              <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-500">
                {Math.round(savingsProgress)} %
              </span>
            </div>
          )}
          {account.overdraftLimit > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Découvert autorisé :{' '}
              {formatAmount(account.overdraftLimit, account.currency)}
            </p>
          )}
          {billing && billing.encours > 0 && (
            <p className="mt-1 text-xs text-amber-700">
              Encours carte : {formatAmount(billing.encours, account.currency)}
              {billing.nextBillingDate && (
                <>
                  {' '}
                  — facturation le{' '}
                  {new Intl.DateTimeFormat('fr-CH').format(
                    billing.nextBillingDate
                  )}
                </>
              )}
              {settlementName && <> — prélèvement sur {settlementName}</>}
            </p>
          )}
          {account.deferredCard && (
            <p className="mt-1 text-xs text-slate-500">
              Carte à débit différé : saisissez vos achats à leur date
              d&apos;achat. Ne saisissez jamais le prélèvement groupé de fin de
              mois — anti-double-compte (M2).
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
