/**
 * Charge Edit Form Component
 *
 * Dedicated edit page form (one page, one responsibility — mock_POC
 * `ChargeFormPage` mode "edit"). Same kit-based fields as creation,
 * prefilled from the persisted charge. Delete is the two-step inline
 * confirmation; deleting navigates back to the list.
 *
 * @module Components/Charges/ChargeEditForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateChargeSchema,
  type Charge,
  type UpdateChargeInput,
} from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import {
  useCharge,
  useUpdateCharge,
  useDeleteCharge,
} from '@/hooks/use-charges';
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
import { DeleteButton } from '@/components/patterns';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { JSX } from 'react';

const CHARGE_TYPES = [
  { value: 'FIXED_RECURRING', label: 'Fixe récurrente' },
  { value: 'INSTALLMENT', label: 'Échelonnée' },
  { value: 'TEMPORARY', label: 'Temporaire' },
  { value: 'ONE_OFF', label: 'Ponctuelle' },
  { value: 'UPCOMING', label: 'À venir (engagée)' },
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

export function ChargeEditForm({
  chargeId,
}: {
  chargeId: string;
}): JSX.Element {
  const router = useRouter();
  const { data: charge, isLoading } = useCharge(chargeId);
  const { data: accounts = [] } = useAccounts();
  const {
    mutate: update,
    isPending: isSaving,
    isSuccess,
    error,
  } = useUpdateCharge(chargeId);
  const { mutateAsync: deleteCharge } = useDeleteCharge();

  const form = useForm<UpdateChargeInput>({
    resolver: zodResolver(updateChargeSchema),
    values: charge ? defaultsOf(charge) : undefined,
  });

  const type = form.watch('type');
  const currency = form.watch('currency');
  const provisioned = form.watch('provisioned');

  const activeAccounts = accounts
    .filter((a) => a.status === 'ACTIVE')
    .map((a) => ({ value: a.id, label: `${a.name} (${a.currency})` }));

  if (isLoading || !charge) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span>Chargement de la charge…</span>
      </div>
    );
  }

  const onSubmit = form.handleSubmit((data) => update(data));

  if (isSuccess) {
    return (
      <FormSuccess message="Charge mise à jour.">
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
        <SelectInput name="category" label="Catégorie" options={CATEGORIES} />
      </FormSection>

      <FormSection title="Montant & compte">
        <ToggleInput name="currency" label="Devise" options={currencyOptions} />
        <AmountInput
          name="amount"
          label={`Montant (${currency ?? charge.currency})`}
        />
        <SelectInput
          name="accountId"
          label="Compte débité"
          options={activeAccounts}
        />
      </FormSection>

      {(type ?? charge.type) === 'FIXED_RECURRING' && (
        <FormSection title="Récurrence">
          <SelectInput
            name="frequency"
            label="Périodicité"
            options={FREQUENCIES}
          />
          <FormHint>
            Échéance générée chaque période. Montant révisable.
          </FormHint>
        </FormSection>
      )}

      {(type ?? charge.type) === 'INSTALLMENT' && (
        <FormSection title="Échéancier">
          <AmountInput name="installments" label="Nombre d'échéances" />
          <TextInput name="startDate" label="Première échéance" type="date" />
        </FormSection>
      )}

      {(type ?? charge.type) === 'TEMPORARY' && (
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

      {(type ?? charge.type) === 'UPCOMING' && (
        <FormSection title="Prévision & provision">
          <TextInput name="startDate" label="Date prévue" type="date" />
          <ToggleInput
            name="provisioned"
            label="Provisionner (lissage mensuel)"
            options={yesNoOptions}
            booleanValue
            currentValue={String(provisioned ?? charge.provisioned)}
          />
        </FormSection>
      )}

      <FormActions
        submitLabel="Enregistrer les modifications"
        isPending={isSaving}
        error={error?.message}
        destructive={
          <DeleteButton
            label="Supprimer la charge"
            message={`Supprimer « ${charge.label} » ? Les récurrences seront arrêtées et l'historique des paiements conservé.`}
            onConfirmed={async () => {
              await deleteCharge(charge.id);
              router.push('/charges');
            }}
          />
        }
      />
    </Form>
  );
}

/** Edit defaults derived from the persisted charge (dates trimmed to ISO day). */
function defaultsOf(charge: Charge): UpdateChargeInput {
  return {
    label: charge.label,
    type: charge.type,
    amount: charge.amount,
    currency: charge.currency,
    accountId: charge.accountId,
    category: charge.category,
    startDate: charge.startDate.slice(0, 10),
    endDate: charge.endDate ? charge.endDate.slice(0, 10) : null,
    frequency: charge.frequency,
    installments: charge.installments,
    provisioned: charge.provisioned,
  };
}
