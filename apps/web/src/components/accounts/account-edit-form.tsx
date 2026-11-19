/**
 * Account Edit Form Component
 *
 * Dedicated edit page form (one page, one responsibility — mock_POC
 * `AccountFormPage` mode "edit"). Kit-based fields prefilled from the
 * persisted account. Closing an account (soft delete, status CLOSED) is
 * the two-step inline confirmation; closing navigates back to the list.
 *
 * @module Components/Accounts/AccountEditForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateAccountSchema,
  type Account,
  type UpdateAccountInput,
} from '@mbongo/shared';
import { useMembers } from '@/hooks/use-members';
import {
  useAccount,
  useAccounts,
  useUpdateAccount,
  useCloseAccount,
} from '@/hooks/use-accounts';
import {
  Form,
  FormSection,
  FormHint,
  TextInput,
  SelectInput,
  ToggleInput,
  AmountInput,
  currencyOptions,
  yesNoOptions,
} from '@/components/form';
import { DeleteButton } from '@/components/patterns';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { JSX } from 'react';

const ACCOUNT_KINDS = [
  { value: 'CURRENT', label: 'Courant' },
  { value: 'CREDIT_CARD', label: 'Carte de crédit' },
  { value: 'JOINT', label: 'Compte joint' },
  { value: 'SAVINGS', label: 'Épargne' },
] as const;

export function AccountEditForm({
  accountId,
}: {
  accountId: string;
}): JSX.Element {
  const router = useRouter();
  const { data: account, isLoading } = useAccount(accountId);
  const { data: members = [] } = useMembers();
  const {
    mutate: update,
    isPending: isSaving,
    isSuccess,
    error,
  } = useUpdateAccount();
  const { mutate: close } = useCloseAccount();

  const form = useForm<UpdateAccountInput>({
    resolver: zodResolver(updateAccountSchema),
    values: account ? defaultsOf(account) : undefined,
  });

  const currency = form.watch('currency');
  const accountType = form.watch('accountType');
  const hasOverdraft = (form.watch('overdraftLimit') ?? 0) > 0;

  const memberOptions = [
    { value: '', label: '— Couple / non rattaché —' },
    ...members.map((m) => ({ value: m.id, label: m.firstName })),
  ];

  const { data: accounts = [] } = useAccounts();
  // Comptes de règlement possibles : actifs, et pas eux-mêmes des cartes.
  const settlementOptions = [
    { value: '', label: '— Choisir le compte de règlement —' },
    ...accounts
      .filter((a) => a.status === 'ACTIVE' && a.accountType !== 'CREDIT_CARD')
      .map((a) => ({ value: a.id, label: a.name })),
  ];

  if (isLoading || !account) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span>Chargement du compte…</span>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((data) =>
    update({ id: account.id, input: data })
  );

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-emerald-700">Compte mis à jour.</p>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push('/accounts')}
        >
          Retour aux comptes
        </Button>
      </div>
    );
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormSection title="Identité">
        <TextInput
          name="name"
          label="Nom du compte"
          placeholder="Ex. UBS Courant"
        />
        <TextInput
          name="bank"
          label="Banque (optionnel)"
          placeholder="UBS, BNP Paribas… (saisie libre)"
        />
        <ToggleInput name="currency" label="Devise" options={currencyOptions} />
        <SelectInput
          name="accountType"
          label="Type de compte"
          options={ACCOUNT_KINDS}
        />
        <SelectInput
          name="memberId"
          label="Propriétaire (optionnel)"
          options={memberOptions}
        />
      </FormSection>

      <FormSection title="Solde">
        <AmountInput
          name="openingBalance"
          label={`Solde initial (${currency ?? account.currency})`}
        />
        {(currency ?? account.currency) === 'CHF' ? (
          <FormHint>
            Pas de découvert autorisé en Suisse — l&apos;app ne proposera que
            des alertes trésorerie.
          </FormHint>
        ) : (
          <>
            <ToggleInput
              name="overdraftLimit"
              label="Découvert autorisé"
              options={yesNoOptions}
              booleanValue
              currentValue={String(hasOverdraft)}
              onChange={(v) =>
                void form.setValue('overdraftLimit', v === 'true' ? 500 : 0, {
                  shouldValidate: true,
                })
              }
            />
            {hasOverdraft && (
              <AmountInput
                name="overdraftLimit"
                label="Montant du découvert (EUR)"
              />
            )}
          </>
        )}
      </FormSection>

      {(accountType ?? account.accountType) === 'CREDIT_CARD' && (
        <FormSection title="Carte">
          <AmountInput
            name="billingDay"
            label="Jour de facturation mensuelle"
          />
          <FormHint>
            Encours suivi sur un compte carte distinct ; facture prélevée sur le
            compte courant lié.
          </FormHint>
          <SelectInput
            name="linkedAccountId"
            label="Prélèvement sur"
            options={settlementOptions}
          />
        </FormSection>
      )}

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
        {isSaving ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </Button>

      <DeleteButton
        label="Clôturer le compte"
        message={`Clôturer « ${account.name} » ? Le compte disparaît de la liste active ; l'historique est conservé.`}
        confirmLabel="Clôturer"
        onDone={() => {
          close(account.id);
          router.push('/accounts');
        }}
      />
    </Form>
  );
}

/** Edit defaults derived from the persisted account (nullable → '' for selects). */
function defaultsOf(account: Account): UpdateAccountInput {
  return {
    name: account.name,
    bank: account.bank,
    currency: account.currency,
    accountType: account.accountType,
    memberId: account.memberId,
    overdraftLimit: account.overdraftLimit,
    deferredCard: account.deferredCard,
    billingDay: account.billingDay,
    linkedAccountId: account.linkedAccountId,
    openingBalance: account.openingBalance,
  };
}
