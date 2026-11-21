/**
 * Charges Step
 *
 * Step 2: Display non-expired charges for the prepared month,
 * allow adjustments, deletion, and creation of new charges.
 * Uses ItemList + CreatePanel + EditableItem patterns.
 *
 * @module Components/Budget/Steps/ChargesStep
 */

'use client';

import {
  useCharges,
  useUpdateCharge,
  useDeleteCharge,
} from '@/hooks/use-charges';
import { ChargeCreateForm } from '@/components/charges/charge-create-form';
import {
  ItemList,
  EditableItem,
  CreatePanel,
  DeleteButton,
} from '@/components/patterns';
import { StepLayout } from './step-layout';
import { JSX } from 'react';
import { isChargeExpiredForMonth, type Charge } from '@mbongo/shared';
import { monthKeyToDate } from '@/lib/month-navigation';

interface ChargesStepProps {
  month: string;
}

/**
 * Charge row adapter — wraps EditableItem with charge-specific behavior.
 * Owns the update/delete mutations for a single charge.
 */
function ChargeRow({ charge }: { charge: Charge }): JSX.Element {
  const update = useUpdateCharge(charge.id);
  const del = useDeleteCharge();

  return (
    <EditableItem
      label={charge.label}
      meta={
        <>
          {charge.amount.toFixed(2)} {charge.currency} — {charge.category}
        </>
      }
      amount={charge.amount}
      currency={charge.currency}
      actionLabel="Ajuster"
      isPending={update.isPending}
      onConfirm={(amount) => update.mutateAsync({ amount })}
      actions={
        <DeleteButton
          label="Supprimer"
          message={`Supprimer « ${charge.label} » ? Les échéances seront arrêtées.`}
          onConfirmed={async () => {
            await del.mutateAsync(charge.id);
          }}
        />
      }
    />
  );
}

export function ChargesStep({ month }: ChargesStepProps): JSX.Element {
  const { data: charges, isLoading } = useCharges();
  const monthDate = monthKeyToDate(month);

  // Filter non-expired charges relative to the prepared month
  const activeCharges = (charges ?? []).filter(
    (charge) => !isChargeExpiredForMonth(charge, monthDate)
  );

  return (
    <StepLayout description="Ajustez vos charges si nécessaire. Les charges expirées sont masquées.">
      <ItemList
        items={activeCharges}
        isLoading={isLoading}
        emptyState="Aucune charge pour ce mois."
        renderItem={(charge) => <ChargeRow charge={charge} />}
        footer={
          <CreatePanel
            title="Nouvelle charge"
            addLabel="Ajouter une charge"
            renderForm={(onSaved) => <ChargeCreateForm onSaved={onSaved} />}
          />
        }
      />
    </StepLayout>
  );
}
