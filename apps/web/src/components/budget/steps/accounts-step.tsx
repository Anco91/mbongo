/**
 * Accounts Step
 *
 * Step 3: Display active accounts, allow balance adjustment,
 * deletion, and creation of new accounts.
 * Uses ItemList + CreatePanel + EditableItem patterns.
 *
 * @module Components/Budget/Steps/AccountsStep
 */

'use client';

import {
  useAccounts,
  useUpdateAccount,
  useCloseAccount,
} from '@/hooks/use-accounts';
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
function AccountRow({ account }: { account: Account }): JSX.Element {
  const update = useUpdateAccount();
  const close = useCloseAccount();

  const isUpdating = update.isPending && update.variables?.id === account.id;

  return (
    <EditableItem
      label={account.name}
      meta={
        <>
          {account.bank ?? '—'} — {account.currency}
          {account.overdraftLimit > 0 &&
            ` — Découvert: ${account.overdraftLimit.toFixed(2)}`}
        </>
      }
      amount={account.openingBalance}
      currency={account.currency}
      actionLabel="Ajuster"
      isPending={isUpdating}
      onConfirm={(amount) =>
        update.mutateAsync({
          id: account.id,
          input: { openingBalance: amount },
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

export function AccountsStep(): JSX.Element {
  const { data: accounts, isLoading } = useAccounts();

  const activeAccounts = (accounts ?? []).filter((a) => a.status === 'ACTIVE');

  return (
    <StepLayout description="Vérifiez vos comptes actifs, ajustez les soldes, ou ajoutez un nouveau compte.">
      <ItemList
        items={activeAccounts}
        isLoading={isLoading}
        emptyState="Aucun compte actif."
        renderItem={(account) => <AccountRow account={account} />}
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
