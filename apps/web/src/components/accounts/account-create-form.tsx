/**
 * Account Create Form Component
 *
 * Dedicated creation page form (one page, one responsibility).
 * Built on the form kit; conditional blocks: overdraft (EUR only),
 * card (billing day), savings (limit + progress). Validation is the
 * shared zod schema — the single source of truth (R7).
 *
 * @module Components/Accounts/AccountCreateForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema, type CreateAccountInput } from '@mbongo/shared';
import { useMembers } from '@/hooks/use-members';
import { useAccounts, useCreateAccount } from '@/hooks/use-accounts';
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
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { JSX } from 'react';

const ACCOUNT_KINDS = [
  { value: 'CURRENT', label: 'Courant' },
  { value: 'CREDIT_CARD', label: 'Carte de crédit' },
  { value: 'JOINT', label: 'Compte joint' },
  { value: 'SAVINGS', label: 'Épargne' },
] as const;

/**
 * AccountCreateForm Component
 */
export function AccountCreateForm(): JSX.Element {
  const { data: members = [] } = useMembers();
  const { data: accounts = [] } = useAccounts();
  const {
    mutate: createAccount,
    isPending: isCreating,
    error,
    isSuccess,
  } = useCreateAccount();

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: '',
      bank: null,
      currency: 'CHF',
      accountType: 'CURRENT',
      memberId: null,
      overdraftLimit: 0,
      deferredCard: false,
      billingDay: null,
      linkedAccountId: null,
      openingBalance: 0,
    },
  });

  const currency = form.watch('currency');
  const accountType = form.watch('accountType');
  const hasOverdraft = (form.watch('overdraftLimit') ?? 0) > 0;

  const memberOptions = [
    { value: '', label: '— Couple / non rattaché —' },
    ...members.map((m) => ({ value: m.id, label: m.firstName })),
  ];

  // Comptes de règlement possibles : actifs, et pas eux-mêmes des cartes.
  const settlementOptions = [
    { value: '', label: '— Choisir le compte de règlement —' },
    ...accounts
      .filter((a) => a.status === 'ACTIVE' && a.accountType !== 'CREDIT_CARD')
      .map((a) => ({ value: a.id, label: a.name })),
  ];

  const onSubmit = form.handleSubmit((data) => createAccount(data));

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-emerald-700">Compte créé.</p>
        </div>
        <Link
          href="/accounts"
          className="inline-block rounded bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
        >
          Retour aux comptes
        </Link>
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
        <FormHint>
          Le code établissement encodé dans l&apos;IBAN (FR) ou le numéro de
          banque (CH) identifie la banque — la saisie manuelle reste libre,
          aucune liste de référence à maintenir.
        </FormHint>
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
          label={`Solde initial (${currency})`}
        />
        {currency === 'CHF' ? (
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

      {accountType === 'CREDIT_CARD' && (
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

      {accountType === 'SAVINGS' && (
        <FormSection title="Plafond">
          <FormHint>Livret A — plafond de 22 950 € par personne.</FormHint>
        </FormSection>
      )}

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isCreating}>
        {isCreating ? 'Création…' : 'Créer le compte'}
      </Button>
    </Form>
  );
}
