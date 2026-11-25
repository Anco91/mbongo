/**
 * Accounts Step
 *
 * Step 3: Display active accounts with their start balance of the month
 * (saved, else suggested), allow adjustment for that month only,
 * deletion, and creation of new accounts.
 * Uses ItemList + CreatePanel + EditableItem patterns.
 *
 * @module Components/Budget/Steps/AccountsStep
 */

'use client';

import { useAccounts, useCloseAccount } from '@/hooks/use-accounts';
import { useSaveMonthStartBalances } from '@/hooks/use-month-start-balances';
import { useMonthStart } from '../use-month-start';
import { AccountCreateForm } from '@/components/accounts/account-create-form';
import {
  ItemList,
  EditableItem,
  CreatePanel,
  DeleteButton,
} from '@/components/patterns';
import { StepLayout } from './step-layout';
import { JSX } from 'react';
import type { Account } from '@mbongo/shared';

/**
 * Account row adapter — wraps EditableItem with account-specific behavior.
 * Owns the update/close mutations for a single account.
 */
function AccountRow({
  account,
  month,
  startBalance,
}: {
  account: Account;
  month: string;
  startBalance: number;
}): JSX.Element {
  const save = useSaveMonthStartBalances();
  const close = useCloseAccount();

  const isUpdating =
    save.isPending &&
    save.variables?.input.balances[0]?.accountId === account.id;

  return (
    <EditableItem
      label={account.name}
      meta={
        <>
          Solde de départ — {account.bank ?? '—'} — {account.currency}
          {account.overdraftLimit > 0 &&
            ` — Découvert: ${account.overdraftLimit.toFixed(2)}`}
        </>
      }
      amount={startBalance}
      currency={account.currency}
      actionLabel="Ajuster"
      isPending={isUpdating}
      onConfirm={(amount) =>
        save.mutateAsync({
          month,
          input: { balances: [{ accountId: account.id, balance: amount }] },
        })
      }
      actions={
        <DeleteButton
          label="Fermer"
          message={`Fermer « ${account.name} » ? Le compte ne sera plus actif.`}
          onConfirmed={async () => {
            await close.mutateAsync(account.id);
          }}
        />
      }
    />
  );
}

export function AccountsStep({ month }: { month: string }): JSX.Element {
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { isLoading: startLoading, suggested, saved } = useMonthStart(month);
  const isLoading = accountsLoading || startLoading;

  const activeAccounts = (accounts ?? []).filter((a) => a.status === 'ACTIVE');

  return (
    <StepLayout description="Vérifiez vos comptes actifs, ajustez les soldes, ou ajoutez un nouveau compte.">
      <ItemList
        items={activeAccounts}
        isLoading={isLoading}
        emptyState="Aucun compte actif."
        renderItem={(account) => (
          <AccountRow
            account={account}
            month={month}
            startBalance={saved[account.id] ?? suggested[account.id] ?? 0}
          />
        )}
        footer={
          <CreatePanel
            title="Nouveau compte"
            addLabel="Ajouter un compte"
            renderForm={(onSaved) => <AccountCreateForm onSaved={onSaved} />}
          />
        }
      />
    </StepLayout>
  );
}
