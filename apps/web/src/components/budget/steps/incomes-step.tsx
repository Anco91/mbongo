/**
 * Incomes Step
 *
 * Step 1: Display active income sources for the month, allow confirmation,
 * adjustment, deletion, and creation of new income sources.
 * Uses ItemList + CreatePanel + EditableItem patterns.
 *
 * @module Components/Budget/Steps/IncomesStep
 */

'use client';

import {
  useIncomes,
  useConfirmIncome,
  useUpdateIncome,
  useDeleteIncome,
} from '@/hooks/use-incomes';
import { IncomeSourceForm } from '@/components/incomes/income-source-form';
import {
  ItemList,
  EditableItem,
  CreatePanel,
  DeleteButton,
} from '@/components/patterns';
import { StepLayout } from './step-layout';
import { JSX } from 'react';
import type { Income } from '@mbongo/shared';

interface IncomesStepProps {
  month: string;
}

/**
 * Income row adapter — wraps EditableItem with income-specific behavior.
 * Owns the confirm/update/delete mutations for a single income source.
 */
function IncomeRow({
  income,
  month,
}: {
  income: Income;
  month: string;
}): JSX.Element {
  const confirm = useConfirmIncome();
  const update = useUpdateIncome();
  const del = useDeleteIncome();

  const isConfirming = confirm.isPending && confirm.variables?.id === income.id;
  const isUpdating = update.isPending && update.variables?.id === income.id;

  return (
    <EditableItem
      label={income.label}
      meta={
        <>
          {income.amount.toFixed(2)} {income.currency} — {income.frequency}
        </>
      }
      amount={income.amount}
      currency={income.currency}
      actionLabel="Confirmer"
      isPending={isConfirming || isUpdating}
      onConfirm={(amount) =>
        confirm.mutateAsync({ id: income.id, input: { month, amount } })
      }
      actions={
        <DeleteButton
          label="Supprimer"
          message={`Supprimer « ${income.label} » ? Les transactions rattachées seront arrêtées.`}
          onConfirmed={async () => {
            await del.mutateAsync(income.id);
          }}
        />
      }
    />
  );
}

export function IncomesStep({ month }: IncomesStepProps): JSX.Element {
  const { data: incomes, isLoading } = useIncomes({ month });

  return (
    <StepLayout description="Confirmez vos revenus pour ce mois. Vous pouvez ajuster le montant, créer ou supprimer des sources.">
      <ItemList
        items={incomes}
        isLoading={isLoading}
        emptyState="Aucune source de revenu active pour ce mois."
        renderItem={(income) => <IncomeRow income={income} month={month} />}
        footer={
          <CreatePanel
            title="Nouveau revenu"
            addLabel="Ajouter un revenu"
            renderForm={(onSaved) => <IncomeSourceForm onSaved={onSaved} />}
          />
        }
      />
    </StepLayout>
  );
}
