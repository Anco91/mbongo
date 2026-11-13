/**
 * Account Create Form Component
 *
 * Dedicated creation page form (one page, one responsibility).
 * Validation is the shared zod schema — the single source of truth (R7).
 *
 * @module Components/Accounts/AccountCreateForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountSchema, type CreateAccountInput } from '@mbongo/shared';
import { useMembers } from '@/components/members/hooks/use-members';
import { useCreateAccount } from './hooks/use-accounts';
import Link from 'next/link';
import { JSX } from 'react';

/**
 * AccountCreateForm Component
 */
export function AccountCreateForm(): JSX.Element {
  const { data: members = [] } = useMembers();
  const {
    mutate: createAccount,
    isPending: isCreating,
    error,
    isSuccess,
  } = useCreateAccount();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateAccountInput>({
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
      openingBalance: 0,
    },
  });

  const currency = watch('currency');
  const accountType = watch('accountType');

  const submit = handleSubmit((data) => createAccount(data));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    void submit(event);
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-emerald-300 rounded-lg bg-emerald-50">
          <p className="text-emerald-700">Compte créé.</p>
        </div>
        <Link
          href="/comptes"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Retour aux comptes
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Nom du compte" error={errors.name?.message}>
        <input
          type="text"
          {...register('name')}
          placeholder="Ex. UBS Courant"
          className={inputClass}
        />
      </Field>

      <Field label="Banque (optionnel)" error={errors.bank?.message}>
        <input
          type="text"
          {...register('bank')}
          placeholder="UBS, BNP Paribas…"
          className={inputClass}
        />
      </Field>

      <Field label="Devise" error={errors.currency?.message}>
        <select {...register('currency')} className={inputClass}>
          <option value="CHF">CHF</option>
          <option value="EUR">EUR</option>
        </select>
      </Field>

      <Field label="Type de compte" error={errors.accountType?.message}>
        <select {...register('accountType')} className={inputClass}>
          <option value="CURRENT">Courant</option>
          <option value="CREDIT_CARD">Carte de crédit</option>
          <option value="JOINT">Compte joint</option>
          <option value="SAVINGS">Épargne</option>
        </select>
      </Field>

      <Field label="Propriétaire (optionnel)" error={errors.memberId?.message}>
        <select {...register('memberId')} className={inputClass}>
          <option value="">— Couple / non rattaché —</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.firstName}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Solde d'ouverture" error={errors.openingBalance?.message}>
        <input
          type="number"
          step="0.01"
          {...register('openingBalance', { valueAsNumber: true })}
          className={inputClass}
        />
      </Field>

      {currency === 'CHF' ? (
        <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700">
          Pas de découvert autorisé en Suisse — seulement des alertes de
          trésorerie.
        </p>
      ) : (
        <Field
          label="Découvert autorisé (0 = aucun)"
          error={errors.overdraftLimit?.message}
        >
          <input
            type="number"
            step="0.01"
            {...register('overdraftLimit', { valueAsNumber: true })}
            className={inputClass}
          />
        </Field>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register('deferredCard')} />
        Carte à débit différé (prélèvement en fin de mois)
      </label>

      {accountType === 'CREDIT_CARD' && (
        <Field
          label="Jour de facturation mensuelle"
          error={errors.billingDay?.message}
        >
          <input
            type="number"
            min={1}
            max={31}
            {...register('billingDay', { valueAsNumber: true })}
            className={inputClass}
          />
        </Field>
      )}

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <button
        type="submit"
        disabled={isCreating}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isCreating ? 'Création…' : 'Créer le compte'}
      </button>

      <Link
        href="/comptes"
        className="block text-center text-sm text-gray-500 hover:text-gray-700"
      >
        Annuler
      </Link>
    </form>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none';

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, error, children }: FieldProps): JSX.Element {
  return (
    <div className="space-y-1.5">
      <label className="block space-y-1.5">
        <span className="block text-xs font-medium text-gray-600">{label}</span>
        {children}
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
