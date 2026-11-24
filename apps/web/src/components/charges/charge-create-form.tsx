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

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { startOfMonth, format } from 'date-fns';
import {
  createChargeSchema,
  listSubcategories,
  type CreateChargeInput,
  type Charge,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useCreateCharge } from '@/hooks/use-charges';
import { DUE_DAY_OPTIONS } from '@/lib/charges';
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
  yesNoOptions,
} from '@/components/form';
import { ChargeCategoryFields } from '@/components/charges/charge-category-fields';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
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

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'yearly', label: 'Annuelle' },
] as const;

/**
 * Validates through the shared schema after clearing `dueDay` outside the
 * monthly recurrence: the hidden selector must not block the submission
 * (spec charge-management — due day is monthly-only).
 */
const resolver: Resolver<CreateChargeInput> = (values, context, options) =>
  zodResolver(createChargeSchema)(
    {
      ...(values.type === 'FIXED_RECURRING' && values.frequency === 'monthly'
        ? values
        : { ...values, dueDay: null }),
      subcategory: clearForeignSubcategory(values.category, values.subcategory),
    },
    context,
    options
  );

/** Empty or foreign sub-category (hidden/stale selector) becomes null. */
function clearForeignSubcategory(
  category: string,
  subcategory: string | null | undefined
): string | null {
  return subcategory && listSubcategories(category).includes(subcategory)
    ? subcategory
    : null;
}

/**
 * ChargeCreateForm Component
 *
 * @param onSaved - Optional callback when charge is created (for inline use).
 *                  If provided, skips FormSuccess and router.push.
 */
export function ChargeCreateForm({
  onSaved,
}: {
  onSaved?: (charge: Charge) => void;
}): JSX.Element {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const {
    mutate: createCharge,
    isPending: isCreating,
    data: createdCharge,
    error,
  } = useCreateCharge();

  const form = useForm<CreateChargeInput>({
    resolver,
    defaultValues: {
      label: '',
      type: 'FIXED_RECURRING',
      amount: 0,
      currency: 'CHF',
      accountId: '',
      category: 'Logement',
      subcategory: null,
      // Le premier jour du mois courant par défaut (spec charge-management).
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: null,
      frequency: 'monthly',
      installments: null,
      dueDay: 1,
      provisioned: false,
    },
  });

  const type = form.watch('type');
  const currency = form.watch('currency');
  const provisioned = form.watch('provisioned');
  const frequency = form.watch('frequency');
  const activeType = CHARGE_TYPES.find((t) => t.value === type);
  const isMonthlyRecurring =
    type === 'FIXED_RECURRING' && frequency === 'monthly';

  const activeAccounts = accounts
    .filter((a) => a.status === 'ACTIVE')
    .map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }));

  const onSubmit = form.handleSubmit((data) =>
    // Le jour de prélèvement n'existe que pour le mensuel (422 sinon).
    createCharge(
      { ...data, dueDay: isMonthlyRecurring ? data.dueDay : null },
      {
        onSuccess: (charge) => {
          if (onSaved) {
            onSaved(charge);
            form.reset();
          }
        },
      }
    )
  );

  // If onSaved is provided (inline use), don't show FormSuccess — the parent handles it
  if (createdCharge && !onSaved) {
    return (
      <FormSuccess message="Charge créée — échéances générées (tout-ou-rien).">
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push('/charges')}
        >
          Retour aux charges
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
        <ChargeCategoryFields />
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
          {isMonthlyRecurring && (
            <SelectInput
              name="dueDay"
              label="Jour de prélèvement"
              options={DUE_DAY_OPTIONS}
            />
          )}
          <FormHint>
            Échéance générée chaque période. Montant révisable (ex. LaMaL
            révisée chaque 1ᵉʳ janvier).
          </FormHint>
        </FormSection>
      )}

      {type === 'INSTALLMENT' && (
        <FormSection title="Échéances">
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
            label="Provisionner (réparti chaque mois)"
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

      <FormActions
        submitLabel="Créer la charge"
        isPending={isCreating}
        error={error?.message}
      />
    </Form>
  );
}
