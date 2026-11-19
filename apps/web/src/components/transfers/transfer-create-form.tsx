/**
 * Transfer Create Form Component
 *
 * Dedicated creation page form (one page, one responsibility — mock_POC).
 * Built on the form kit. Phase 1 only: the transfer is created as
 * ESTIMATED; the credit is recorded later from the transfers list.
 * Validation is the shared zod schema — the single source of truth (R7).
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
import { useAccounts } from '@/hooks/use-accounts';
import { useCreateTransfer } from '@/hooks/use-transfers';
import {
  Form,
  FormSection,
  FormHint,
  TextInput,
  SelectInput,
  AmountInput,
} from '@/components/form';
import { Button } from '@/components/ui/button';
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

  const form = useForm<CreateTransferInput>({
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

  const amountSent = form.watch('amountSent');
  const rateEstimated = form.watch('rateEstimated');
  const sourceAccountId = form.watch('sourceAccountId');
  const targetAccountId = form.watch('targetAccountId');

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');
  const chfAccounts = activeAccounts
    .filter((a) => a.currency === 'CHF')
    .map((a) => ({ value: a.id, label: a.name }));
  const eurAccounts = activeAccounts
    .filter((a) => a.currency === 'EUR')
    .map((a) => ({ value: a.id, label: a.name }));

  // Live estimated counter-value preview (shared domain function).
  const hasPreview =
    typeof amountSent === 'number' &&
    amountSent > 0 &&
    typeof rateEstimated === 'number' &&
    rateEstimated > 0;
  const preview = hasPreview ? counterValue(amountSent, rateEstimated) : null;

  const onSubmit = form.handleSubmit((data) => createTransfer(data));

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-emerald-700">
            Transfert enregistré (estimé). Enregistrez le crédit reçu depuis la
            liste des transferts.
          </p>
        </div>
        <Link
          href="/transfers"
          className="inline-block rounded bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
        >
          Retour aux transferts
        </Link>
      </div>
    );
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormSection title="Comptes">
        <SelectInput
          name="sourceAccountId"
          label="Compte source (CHF)"
          options={chfAccounts}
          placeholder="— Choisir un compte CHF —"
        />
        <SelectInput
          name="targetAccountId"
          label="Compte cible (EUR)"
          options={eurAccounts}
          placeholder="— Choisir un compte EUR —"
        />
        {sourceAccountId &&
          targetAccountId &&
          sourceAccountId === targetAccountId && (
            <p className="text-xs text-red-600">
              Le compte cible doit être différent du compte source.
            </p>
          )}
      </FormSection>

      <FormSection title="Montant & taux">
        <AmountInput name="amountSent" label="Montant envoyé (CHF)" />
        <AmountInput
          name="rateEstimated"
          label="Taux de référence (EUR pour 1 CHF)"
          hint="Ex. 1,0634 → 1 CHF ≈ 1,0634 EUR"
        />
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
      </FormSection>

      <FormSection title="Dates & mémo">
        <TextInput
          name="rateDate"
          label="Date du taux de référence"
          type="date"
        />
        <TextInput name="sentAt" label="Date d'envoi" type="date" />
        <TextInput name="memo" label="Mémo (optionnel)" />
        <FormHint>
          Deux phases : estimé à l&apos;envoi, recalculé au crédit réel. Le taux
          est toujours daté, les frais jamais fondus dedans.
        </FormHint>
      </FormSection>

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isCreating}>
        {isCreating ? 'Enregistrement…' : 'Enregistrer le transfert (estimé)'}
      </Button>
    </Form>
  );
}
