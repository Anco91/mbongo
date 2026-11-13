/**
 * Charge Create Form Component
 *
 * Dedicated creation page form (one page, one responsibility — mock_POC).
 * The form adapts its fields to the selected charge type, and validation
 * is the shared zod schema — the single source of truth (R7).
 *
 * @module Components/Charges/ChargeCreateForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createChargeSchema, type CreateChargeInput } from '@mbongo/shared';
import { useAccounts } from '@/components/accounts/hooks/use-accounts';
import { useCreateCharge } from './hooks/use-charges';
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
];

/**
 * ChargeCreateForm Component
 */
export function ChargeCreateForm(): JSX.Element {
  const { data: accounts = [] } = useAccounts();
  const {
    mutate: createCharge,
    isPending: isCreating,
    data: createResult,
    error,
  } = useCreateCharge();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateChargeInput>({
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

  const type = watch('type');
  const activeType = CHARGE_TYPES.find((t) => t.value === type);

  const submit = handleSubmit((data) => createCharge(data));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    void submit(event);
  };

  if (createResult) {
    return (
      <div className="space-y-4">
        {createResult.paymentsError ? (
          <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50">
            <p className="text-sm text-yellow-700">
              Charge créée, mais la génération des échéances a échoué.
            </p>
          </div>
        ) : (
          <div className="p-4 border border-emerald-300 rounded-lg bg-emerald-50">
            <p className="text-emerald-700">
              Charge créée — échéances générées.
            </p>
          </div>
        )}
        <Link
          href="/charges"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Retour aux charges
        </Link>
      </div>
    );
  }

  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE');

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Intitulé" error={errors.label?.message}>
        <input
          type="text"
          {...register('label')}
          placeholder="Ex. Loyer GE, LaMaL…"
          className={inputClass}
        />
      </Field>

      <Field label="Type de charge" error={errors.type?.message}>
        <select {...register('type')} className={inputClass}>
          {CHARGE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {activeType && (
          <p className="text-[11px] text-gray-400">{activeType.hint}</p>
        )}
      </Field>

      <Field label="Catégorie" error={errors.category?.message}>
        <select {...register('category')} className={inputClass}>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Devise" error={errors.currency?.message}>
        <select {...register('currency')} className={inputClass}>
          <option value="CHF">CHF</option>
          <option value="EUR">EUR</option>
        </select>
      </Field>

      <Field label="Montant" error={errors.amount?.message}>
        <input
          type="number"
          step="0.01"
          {...register('amount', { valueAsNumber: true })}
          className={inputClass}
        />
      </Field>

      <Field label="Compte débité" error={errors.accountId?.message}>
        <select {...register('accountId')} className={inputClass}>
          <option value="">— Choisir un compte —</option>
          {activeAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.currency})
            </option>
          ))}
        </select>
      </Field>

      {type === 'FIXED_RECURRING' && (
        <FormSection title="Récurrence">
          <Field label="Périodicité" error={errors.frequency?.message}>
            <select {...register('frequency')} className={inputClass}>
              <option value="monthly">Mensuelle</option>
              <option value="yearly">Annuelle</option>
            </select>
          </Field>
          <p className="rounded-lg bg-gray-50 p-2.5 text-[11px] text-gray-500">
            Échéance générée chaque période. Montant révisable (ex. LaMaL
            révisée chaque 1ᵉʳ janvier).
          </p>
        </FormSection>
      )}

      {type === 'INSTALLMENT' && (
        <FormSection title="Échéancier">
          <Field
            label="Nombre d'échéances"
            error={errors.installments?.message}
          >
            <input
              type="number"
              min={2}
              {...register('installments', { valueAsNumber: true })}
              className={inputClass}
            />
          </Field>
          <Field label="Première échéance" error={errors.startDate?.message}>
            <input
              type="date"
              {...register('startDate')}
              className={inputClass}
            />
          </Field>
        </FormSection>
      )}

      {type === 'TEMPORARY' && (
        <FormSection title="Récurrence bornée">
          <Field label="Périodicité" error={errors.frequency?.message}>
            <select {...register('frequency')} className={inputClass}>
              <option value="monthly">Mensuelle</option>
              <option value="yearly">Annuelle</option>
            </select>
          </Field>
          <Field label="Fin de l'engagement" error={errors.endDate?.message}>
            <input
              type="date"
              {...register('endDate')}
              className={inputClass}
            />
          </Field>
        </FormSection>
      )}

      {type === 'ONE_OFF' && (
        <FormSection title="Paiement">
          <Field label="Date" error={errors.startDate?.message}>
            <input
              type="date"
              {...register('startDate')}
              className={inputClass}
            />
          </Field>
        </FormSection>
      )}

      {type === 'UPCOMING' && (
        <FormSection title="Prévision & provision">
          <Field label="Date prévue" error={errors.startDate?.message}>
            <input
              type="date"
              {...register('startDate')}
              className={inputClass}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register('provisioned')} />
            Provisionner (lissage mensuel)
          </label>
        </FormSection>
      )}

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <button
        type="submit"
        disabled={isCreating}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isCreating ? 'Création…' : 'Créer la charge'}
      </button>

      <Link
        href="/charges"
        className="block text-center text-sm text-gray-500 hover:text-gray-700"
      >
        Annuler
      </Link>
    </form>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none';

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="space-y-3 border-t border-gray-100 pt-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
        {title}
      </p>
      {children}
    </section>
  );
}

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
