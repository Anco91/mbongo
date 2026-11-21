/**
 * Accounts Step
 *
 * Step 3: Display active accounts and their balances (read-only).
 * Uses ItemList pattern for consistent async handling.
 *
 * @module Components/Budget/Steps/AccountsStep
 */

'use client';

import { useAccounts } from '@/hooks/use-accounts';
import { ItemList } from '@/components/patterns';
import { StepLayout } from './step-layout';
import { JSX } from 'react';
import type { Account } from '@mbongo/shared';

export function AccountsStep(): JSX.Element {
  const { data: accounts, isLoading } = useAccounts();

  const activeAccounts = (accounts ?? []).filter((a) => a.status === 'ACTIVE');

  return (
    <StepLayout description="Vérifiez vos comptes actifs et leur solde.">
      <ItemList
        items={activeAccounts}
        isLoading={isLoading}
        emptyState="Aucun compte actif."
        renderItem={(account) => <AccountRow account={account} />}
      />
    </StepLayout>
  );
}

/** Read-only account row with balance and overdraft info. */
function AccountRow({ account }: { account: Account }): JSX.Element {
  return (
    <>
      <div>
        <p className="font-medium">{account.name}</p>
        <p className="text-sm text-slate-600">
          {account.bank ?? '—'} — {account.currency}
        </p>
      </div>

      <div className="text-right">
        <p className="font-medium">
          {account.openingBalance.toFixed(2)} {account.currency}
        </p>
        {account.overdraftLimit > 0 && (
          <p className="text-xs text-slate-500">
            Découvert : {account.overdraftLimit.toFixed(2)} {account.currency}
          </p>
        )}
      </div>
    </>
  );
}
