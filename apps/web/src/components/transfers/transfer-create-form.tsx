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

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTransferSchema,
  counterValue,
  isSameCurrencyTransfer,
  checkTransferAccounts,
  type Account,
  type CreateTransferInput,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreateTransfer } from '@/hooks/use-transfers';
import {
  Form,
  FormActions,
  FormSection,
  FormSuccess,
  FormHint,
  TextInput,
  SelectInput,
  AmountInput,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { JSX } from 'react';
import type { z } from 'zod';

/**
 * Form-level schema: extends the shared create schema with the account rules
 * (any pair of open accounts) enforced client-side before any request.
 * Same-account stays on the shared schema. Pure function.
 */
export function buildTransferFormSchema(
  accounts: Account[]
): z.ZodEffects<typeof createTransferSchema> {
  return createTransferSchema.superRefine((transfer, context) => {
    const source = accounts.find((a) => a.id === transfer.sourceAccountId);
    const target = accounts.find((a) => a.id === transfer.targetAccountId);
    if (source?.status === 'CLOSED') {
      context.addIssue({
        code: 'custom',
        path: ['sourceAccountId'],
        message: 'Le compte source est clôturé',
      });
    }
    if (target?.status === 'CLOSED') {
      context.addIssue({
        code: 'custom',
        path: ['targetAccountId'],
        message: 'Le compte cible est clôturé',
      });
    }
  });
}

/** Rate of a same-currency transfer (no conversion, rate field hidden). */
const SAME_CURRENCY_RATE = 1;

/**
 * Resolver wrapper: a same-currency pair has no rate field, so the rate is
 * set to SAME_CURRENCY_RATE before validation (the hidden 0 must not block
 * submit). Other pairs are validated unchanged. Pure function.
 */
export function buildTransferFormResolver(
  accounts: Account[]
): Resolver<CreateTransferInput> {
  const resolve = zodResolver(buildTransferFormSchema(accounts));
  return (values, context, options) => {
    const source = accounts.find((a) => a.id === values.sourceAccountId);
    const target = accounts.find((a) => a.id === values.targetAccountId);
    const sameCurrency =
      source !== undefined &&
      target !== undefined &&
      isSameCurrencyTransfer(source, target);
    return resolve(
      sameCurrency ? { ...values, rateEstimated: SAME_CURRENCY_RATE } : values,
      context,
      options
    );
  };
}

/**
 * TransferCreateForm Component
 */
export function TransferCreateForm(): JSX.Element {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const {
    mutate: createTransfer,
    isPending: isCreating,
    isSuccess,
    error,
  } = useCreateTransfer();

  const form = useForm<CreateTransferInput>({
    resolver: buildTransferFormResolver(accounts),
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

  const accountOptions = accounts
    .filter((a) => a.status === 'ACTIVE')
    .map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }));
  const source = accounts.find((a) => a.id === sourceAccountId);
  const target = accounts.find((a) => a.id === targetAccountId);
  const sameCurrency =
    source !== undefined &&
    target !== undefined &&
    isSameCurrencyTransfer(source, target);
  const pairRefusal =
    source && target ? checkTransferAccounts(source, target) : null;

  // Live estimated counter-value preview (shared domain function).
  const hasPreview =
    !sameCurrency &&
    typeof amountSent === 'number' &&
    amountSent > 0 &&
    typeof rateEstimated === 'number' &&
    rateEstimated > 0;
  const preview = hasPreview ? counterValue(amountSent, rateEstimated) : null;

  // The resolver already normalises the rate for same-currency pairs.
  const onSubmit = form.handleSubmit((data) => createTransfer(data));

  if (isSuccess) {
    return (
      <FormSuccess
        message={
          sameCurrency
            ? 'Transfert enregistré et crédité.'
            : 'Transfert enregistré (estimé). Enregistrez le crédit reçu depuis la liste des transferts.'
        }
      >
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push('/transfers')}
        >
          Retour aux transferts
        </Button>
      </FormSuccess>
    );
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormSection title="Comptes">
        <SelectInput
          name="sourceAccountId"
          label="Compte source"
          options={accountOptions}
          placeholder="— Choisir un compte —"
        />
        <SelectInput
          name="targetAccountId"
          label="Compte cible"
          options={accountOptions}
          placeholder="— Choisir un compte —"
        />
        {pairRefusal && source?.id === target?.id && (
          <p className="text-xs text-red-600">
            Le compte cible doit être différent du compte source.
          </p>
        )}
      </FormSection>

      <FormSection title={sameCurrency ? 'Montant' : 'Montant & taux'}>
        <AmountInput
          name="amountSent"
          label={`Montant envoyé${source ? ` (${source.currency})` : ''}`}
        />
        {!sameCurrency && (
          <AmountInput
            name="rateEstimated"
            label="Taux de référence (devise cible pour 1 devise source)"
            hint="Ex. 1,0634 → 1 CHF ≈ 1,0634 EUR"
          />
        )}
        {preview !== null && (
          <p className="rounded-lg bg-indigo-50 p-2.5 text-sm text-indigo-700">
            Contre-valeur estimée :{' '}
            <span className="font-semibold">
              {new Intl.NumberFormat('fr-CH', {
                style: 'currency',
                currency: target?.currency ?? 'EUR',
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

      <FormActions
        submitLabel={
          sameCurrency
            ? 'Enregistrer le transfert'
            : 'Enregistrer le transfert (estimé)'
        }
        isPending={isCreating}
        error={error?.message}
      />
    </Form>
  );
}
