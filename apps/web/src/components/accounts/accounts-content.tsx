/**
 * Accounts Content Component
 *
 * Client presentation (maquette `AccountsScreen`): tappable account cards,
 * computed balances (shared computeBalance — R9), savings progress and
 * card encours. Tap opens the edit page (one page, one responsibility).
 *
 * @module Components/Accounts/AccountsContent
 */

'use client';

import { JSX, useState } from 'react';
import Link from 'next/link';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useMembers } from '@/hooks/use-members';
import { cardBilling, computeBalance } from '@mbongo/shared';
import { formatAmount } from '@/components/common/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { IconPlus } from '@/components/common/icons';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CURRENT: 'Compte principal',
  CREDIT_CARD: 'Carte de crédit',
  JOINT: 'Compte joint',
  SAVINGS: 'Épargne',
};

/** Known statutory ceiling (Livret A, per person) — display only. */
const LIVRET_A_CEILING = 22950;

export function AccountsContent(): JSX.Element {
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const { data: accounts = [], isLoading, error, refetch } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: members = [] } = useMembers();

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span>Loading accounts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <h3 className="mb-2 font-semibold text-red-700">
          Error loading accounts
        </h3>
        <p className="mb-3 text-sm text-red-600">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Closed accounts disappear from the current view (history preserved).
  const activeAccounts = accounts.filter(
    (account) =>
      account.status === 'ACTIVE' &&
      (selectedMember === 'all' || account.memberId === selectedMember)
  );

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Comptes</h2>
        <p className="text-xs text-slate-500">
          Consolidation en euros, devises natives conservées. Touchez un compte
          pour le modifier ou le clôturer.
        </p>
      </div>

      {/* Filtre Membres du foyer */}
      {members.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedMember('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedMember === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous les membres
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMember(m.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedMember === m.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m.firstName}
            </button>
          ))}
        </div>
      )}

      {activeAccounts.map((account) => {
        const accountTransactions = transactions.filter(
          (transaction) => transaction.accountId === account.id
        );
        const balance = computeBalance(account, accountTransactions);
        // M2 (spec deferred-card) : encours carte calculé à la volée,
        // jamais stocké. Affiché pour toute carte (crédit ou différé).
        const isCard =
          account.accountType === 'CREDIT_CARD' || account.deferredCard;
        const billing = isCard
          ? cardBilling(account, accountTransactions, new Date())
          : null;
        const settlement = billing
          ? activeAccounts.find((c) => c.id === billing.settlementAccountId)
          : null;
        const savingsProgress =
          account.accountType === 'SAVINGS' && account.currency === 'EUR'
            ? Math.min(100, (account.openingBalance / LIVRET_A_CEILING) * 100)
            : null;

        return (
          <Link
            key={account.id}
            href={`/accounts/${account.id}/edit`}
            className="block"
          >
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
                  <Badge
                    variant="outline"
                    className="text-[10px] text-slate-500"
                  >
                    {ACCOUNT_TYPE_LABELS[account.accountType] ??
                      account.accountType}
                  </Badge>
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
                    <span className="text-[11px] text-slate-500">
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
                    Encours carte :{' '}
                    {formatAmount(billing.encours, account.currency)}
                    {billing.nextBillingDate && (
                      <>
                        {' '}
                        — facturation le{' '}
                        {new Intl.DateTimeFormat('fr-CH').format(
                          billing.nextBillingDate
                        )}
                      </>
                    )}
                    {settlement && <> — prélèvement sur {settlement.name}</>}
                  </p>
                )}
                {account.deferredCard && (
                  <p className="mt-1 text-xs text-slate-500">
                    Carte à débit différé : saisissez vos achats à leur date
                    d&apos;achat. Ne saisissez jamais le prélèvement groupé de
                    fin de mois — anti-double-compte (M2).
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}

      {activeAccounts.length === 0 && (
        <div className="rounded-lg border border-slate-200 p-8 text-center">
          <h3 className="mb-2 text-base font-semibold text-slate-800">
            No accounts yet
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            Créez un premier compte pour suivre vos soldes.
          </p>
        </div>
      )}

      <Link href="/accounts/new" className="block">
        <Button variant="outline" size="lg" className="w-full">
          <IconPlus className="h-4 w-4" /> Nouveau compte
        </Button>
      </Link>
    </div>
  );
}
