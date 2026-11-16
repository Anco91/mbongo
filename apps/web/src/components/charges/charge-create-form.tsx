/**
 * Charge Create Form Component
 *
 * Dedicated creation page form (one page, one responsibility — mock_POC).
 * Built entirely on the form kit (styles live in the primitives, never here).
 * The form adapts its fields to the selected charge type, and validation
 * is the shared zod schema — the single source of truth (R7).
 *
 * @module Components/Charges/ChargeCreateForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createChargeSchema, type CreateChargeInput } from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreateCharge } from '@/hooks/use-charges';
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
} from '@/components/common/form-kit';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { JSX } from 'react';

const CHARGE_TYPES = [
  {
    value: 'FIXED_RECURRING',
    label: 'Fixe récurrente',
    hint: 'Loyer, LaMaL, assurance — montant révisable',
  },
  {
    value: 'INSTALLMENT',
    label: 'Échelonnée',
    hint: 'Impôt, crédit — N prélèvements programmés',
  },
  {
    value: 'TEMPORARY',
    label: 'Temporaire',
    hint: 'Abonnement — récurrence à fin connue',
  },
  { value: 'ONE_OFF', label: 'Ponctuelle', hint: 'Sans récurrence' },
  {
    value: 'UPCOMING',
    label: 'À venir (engagée)',
    hint: 'SERAFE, régularisation — provisionnable',
  },
] as const;

const CATEGORIES = [
  'Logement',
  'Santé',
  'Impôts & taxes',
  'Assurances',
  'Abonnements',
  'Médias',
  'Divers',
].map((c) => ({ value: c, label: c }));

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'yearly', label: 'Annuelle' },
] as const;

/**
 * ChargeCreateForm Component
 */
export function ChargeCreateForm(): JSX.Element {
  const { data: accounts = [] } = useAccounts();
  const {
    mutate: createCharge,
    isPending: isCreating,
    data: createdCharge,
    error,
  } = useCreateCharge();

  const form = useForm<CreateChargeInput>({
    resolver: zodResolver(createChargeSchema),
    defaultValues: {
      label: '',
      type: 'FIXED_RECURRING',
      amount: 0,
      currency: 'CHF',
      accountId: '',
      category: 'Logement',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      frequency: 'monthly',
      installments: null,
      provisioned: false,
    },
  });

  const type = form.watch('type');
  const currency = form.watch('currency');
  const provisioned = form.watch('provisioned');
  const activeType = CHARGE_TYPES.find((t) => t.value === type);

  const activeAccounts = accounts
    .filter((a) => a.status === 'ACTIVE')
    .map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }));

  const onSubmit = form.handleSubmit((data) => createCharge(data));

  if (createdCharge) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-emerald-700">
            Charge créée — échéances générées (tout-ou-rien).
          </p>
        </div>
        <Link
          href="/charges"
          className="inline-block rounded bg-slate-900 px-4 py-2 text-white transition-colors hover:bg-slate-800"
        >
          Retour aux charges
        </Link>
      </div>
    );
  }

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormSection title="Général">
        <TextInput
          name="label"
          label="Intitulé"
          placeholder="Ex. Loyer GE, LaMaL…"
        />
        <SelectInput
          name="type"
          label="Type de charge"
          options={CHARGE_TYPES}
        />
        {activeType && (
          <p className="-mt-1 text-[11px] text-slate-400">{activeType.hint}</p>
        )}
        <SelectInput name="category" label="Catégorie" options={CATEGORIES} />
      </FormSection>

      <FormSection title="Montant & compte">
        <ToggleInput name="currency" label="Devise" options={currencyOptions} />
        <AmountInput name="amount" label={`Montant (${currency})`} />
        <SelectInput
          name="accountId"
          label="Compte débité"
          options={activeAccounts}
          placeholder="— Choisir un compte —"
        />
      </FormSection>

      {/* Conditional block — the form adapts to the charge type */}
      {type === 'FIXED_RECURRING' && (
        <FormSection title="Récurrence">
          <SelectInput
            name="frequency"
            label="Périodicité"
            options={FREQUENCIES}
          />
          <FormHint>
            Échéance générée chaque période. Montant révisable (ex. LaMaL
            révisée chaque 1ᵉʳ janvier).
          </FormHint>
        </FormSection>
      )}

      {type === 'INSTALLMENT' && (
        <FormSection title="Échéancier">
          <AmountInput name="installments" label="Nombre d'échéances" />
          <TextInput name="startDate" label="Première échéance" type="date" />
        </FormSection>
      )}

      {type === 'TEMPORARY' && (
        <FormSection title="Récurrence bornée">
          <SelectInput
            name="frequency"
            label="Périodicité"
            options={FREQUENCIES}
          />
          <TextInput name="startDate" label="Début" type="date" />
          <TextInput name="endDate" label="Fin de l'engagement" type="date" />
        </FormSection>
      )}

      {type === 'ONE_OFF' && (
        <FormSection title="Paiement">
          <TextInput name="startDate" label="Date" type="date" />
        </FormSection>
      )}

      {type === 'UPCOMING' && (
        <FormSection title="Prévision & provision">
          <TextInput name="startDate" label="Date prévue" type="date" />
          <ToggleInput
            name="provisioned"
            label="Provisionner (lissage mensuel)"
            options={yesNoOptions}
            booleanValue
          />
          {provisioned && (
            <FormHint>
              {currency === 'CHF'
                ? '335,00 CHF / an → 27,92 CHF / mois'
                : 'Montant / an → montant / 12 par mois'}{' '}
              débités du compte sélectionné.
            </FormHint>
          )}
        </FormSection>
      )}

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={isCreating}>
        {isCreating ? 'Création…' : 'Créer la charge'}
      </Button>
    </Form>
  );
}
