/**
 * Transfer Create Form Component
 *
 * Dedicated creation page form (one page, one responsibility — mock_POC).
 * Phase 1 only: the transfer is created as ESTIMATED; the credit is
 * recorded later from the transfers list. Validation is the shared zod
 * schema — the single source of truth (R7).
 *
 * @module Components/Transfers/TransferCreateForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTransferSchema,
  counterValue,
  type Account,
  type CreateTransferInput,
} from '@mbongo/shared';
import { useAccounts } from '@/components/accounts/hooks/use-accounts';
import { useCreateTransfer } from './hooks/use-transfers';
import Link from 'next/link';
import { JSX } from 'react';
import type { z } from 'zod';

/**
 * Form-level schema: extends the shared create schema with the currency
 * rule enforced client-side (source CHF, target EUR) before any request
 * is sent. Pure function — unit-testable without React.
 */
export function buildTransferFormSchema(
  accounts: Account[]
): z.ZodEffects<typeof createTransferSchema> {
  return createTransferSchema.superRefine((transfer, context) => {
    const source = accounts.find((a) => a.id === transfer.sourceAccountId);
    const target = accounts.find((a) => a.id === transfer.targetAccountId);
    if (source && source.currency !== 'CHF') {
      context.addIssue({
        code: 'custom',
        path: ['sourceAccountId'],
        message: 'Le compte source doit être en CHF',
      });
    }
    if (target && target.currency !== 'EUR') {
      context.addIssue({
        code: 'custom',
        path: ['targetAccountId'],
        message: 'Le compte cible doit être en EUR',
      });
    }
  });
}

/**
 * TransferCreateForm Component
 */
export function TransferCreateForm(): JSX.Element {
  const { data: accounts = [] } = useAccounts();
  const {
    mutate: createTransfer,
    isPending: isCreating,
    isSuccess,
    error,
  } = useCreateTransfer();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateTransferInput>({
    resolver: zodResolver(buildTransferFormSchema(accounts)),
    defaultValues: {
      sourceAccountId: '',
      targetAccountId: '',
      amountSent: 0,
      rateEstimated: 0,
      rateDate: new Date().toISOString().slice(0, 10),
      sentAt: new Date().toISOString().slice(0, 10),
      memo: null,
    },
  });

  const amountSent = watch('amountSent');
  const rateEstimated = watch('rateEstimated');
  const sourceAccountId = watch('sourceAccountId');
  const targetAccountId = watch('targetAccountId');

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');
  const chfAccounts = activeAccounts.filter((a) => a.currency === 'CHF');
  const eurAccounts = activeAccounts.filter((a) => a.currency === 'EUR');

  // Live estimated counter-value preview (shared domain function).
  const hasPreview =
    typeof amountSent === 'number' &&
    amountSent > 0 &&
    typeof rateEstimated === 'number' &&
    rateEstimated > 0;
  const preview = hasPreview ? counterValue(amountSent, rateEstimated) : null;

  const submit = handleSubmit((data) => createTransfer(data));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    void submit(event);
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-emerald-300 rounded-lg bg-emerald-50">
          <p className="text-emerald-700">
            Transfert enregistré (estimé). Enregistrez le crédit reçu depuis la
            liste des transferts.
          </p>
        </div>
        <Link
          href="/transferts"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Retour aux transferts
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field
        label="Compte source (CHF)"
        error={errors.sourceAccountId?.message}
      >
        <select {...register('sourceAccountId')} className={inputClass}>
          <option value="">— Choisir un compte CHF —</option>
          {chfAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Compte cible (EUR)" error={errors.targetAccountId?.message}>
        <select {...register('targetAccountId')} className={inputClass}>
          <option value="">— Choisir un compte EUR —</option>
          {eurAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </Field>

      {sourceAccountId &&
        targetAccountId &&
        sourceAccountId === targetAccountId && (
          <p className="text-xs text-red-600">
            Le compte cible doit être différent du compte source.
          </p>
        )}

      <Field label="Montant envoyé (CHF)" error={errors.amountSent?.message}>
        <input
          type="number"
          step="0.01"
          min="0"
          {...register('amountSent', { valueAsNumber: true })}
          className={inputClass}
        />
      </Field>

      <Field
        label="Taux de référence (EUR pour 1 CHF)"
        error={errors.rateEstimated?.message}
      >
        <input
          type="number"
          step="0.0001"
          min="0"
          {...register('rateEstimated', { valueAsNumber: true })}
          className={inputClass}
        />
        <p className="text-[11px] text-gray-400">
          Ex. 1,0634 → 1 CHF ≈ 1,0634 EUR
        </p>
      </Field>

      {preview !== null && (
        <p className="rounded-lg bg-indigo-50 p-2.5 text-sm text-indigo-700">
          Contre-valeur estimée :{' '}
          <span className="font-semibold">
            {new Intl.NumberFormat('fr-CH', {
              style: 'currency',
              currency: 'EUR',
            }).format(preview)}
          </span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Date du taux de référence"
          error={errors.rateDate?.message}
        >
          <input type="date" {...register('rateDate')} className={inputClass} />
        </Field>

        <Field label="Date d'envoi" error={errors.sentAt?.message}>
          <input type="date" {...register('sentAt')} className={inputClass} />
        </Field>
      </div>

      <Field label="Mémo (optionnel)" error={errors.memo?.message}>
        <input type="text" {...register('memo')} className={inputClass} />
      </Field>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <button
        type="submit"
        disabled={isCreating}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isCreating ? 'Enregistrement…' : 'Enregistrer le transfert (estimé)'}
      </button>

      <Link
        href="/transferts"
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
