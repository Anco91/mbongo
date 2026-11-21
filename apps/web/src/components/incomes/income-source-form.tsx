/**
 * Income Source Form Component
 *
 * Dual-mode creation form for income sources.
 * - Inline mode (onSaved provided): callback on success, no redirect.
 * - Page mode (no onSaved): FormSuccess + redirect to /incomes.
 *
 * Built on the form kit; validation is the shared zod schema (R7).
 *
 * @module Components/Incomes/IncomeSourceForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createIncomeSchema,
  type CreateIncomeInput,
  type Income,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreateIncome } from '@/hooks/use-incomes';
import {
  Form,
  FormActions,
  FormSection,
  FormSuccess,
  FormHint,
  TextInput,
  SelectInput,
  ToggleInput,
  AmountInput,
  currencyOptions,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { JSX } from 'react';

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'yearly', label: 'Annuelle' },
] as const;

/**
 * IncomeSourceForm Component
 *
 * @param onSaved - Optional callback when income is created (for inline use).
 *                  If provided, skips FormSuccess and router.push.
 */
export function IncomeSourceForm({
  onSaved,
}: {
  onSaved?: (income: Income) => void;
}): JSX.Element {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const {
    mutate: createIncome,
    isPending: isCreating,
    data: createdIncome,
    error,
  } = useCreateIncome();

  const form = useForm<CreateIncomeInput>({
    resolver: zodResolver(createIncomeSchema),
    defaultValues: {
      label: '',
      amount: 0,
      currency: 'CHF',
      accountId: '',
      frequency: 'monthly',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
    },
  });

  const currency = form.watch('currency');

  const activeAccounts = accounts
    .filter((a) => a.status === 'ACTIVE')
    .map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }));

  const onSubmit = form.handleSubmit((data) =>
    createIncome(data, {
      onSuccess: (income) => {
        if (onSaved) {
          onSaved(income);
          form.reset();
        }
      },
    })
  );

  // If onSaved is provided (inline use), don't show FormSuccess — the parent handles it
  if (createdIncome && !onSaved) {
    return (
      <FormSuccess message="Source de revenu créée.">
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push('/incomes')}
        >
          Retour aux revenus
        </Button>
      </FormSuccess>
    );
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormSection title="Général">
        <TextInput
          name="label"
          label="Intitulé"
          placeholder="Ex. Salaire, Freelance…"
        />
      </FormSection>

      <FormSection title="Montant & compte">
        <ToggleInput name="currency" label="Devise" options={currencyOptions} />
        <AmountInput name="amount" label={`Montant (${currency})`} />
        <SelectInput
          name="accountId"
          label="Compte crédité"
          options={activeAccounts}
          placeholder="— Choisir un compte —"
        />
      </FormSection>

      <FormSection title="Récurrence">
        <SelectInput
          name="frequency"
          label="Périodicité"
          options={FREQUENCIES}
        />
        <TextInput name="startDate" label="Date de début" type="date" />
        <TextInput name="endDate" label="Date de fin (optionnel)" type="date" />
        <FormHint>
          Laissez la date de fin vide pour un revenu récurrent sans expiration.
        </FormHint>
      </FormSection>

      <FormActions
        submitLabel="Créer le revenu"
        isPending={isCreating}
        error={error?.message}
      />
    </Form>
  );
}
