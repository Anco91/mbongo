/**
 * Incomes Step
 *
 * Step 1: Display active income sources for the month and allow confirmation.
 * Uses ItemList + EditableItem patterns for clean composition.
 *
 * @module Components/Budget/Steps/IncomesStep
 */

'use client';

import { useIncomes, useConfirmIncome } from '@/hooks/use-incomes';
import { ItemList, EditableItem } from '@/components/patterns';
import { StepLayout } from './step-layout';
import { JSX } from 'react';

interface IncomesStepProps {
  month: string;
}

export function IncomesStep({ month }: IncomesStepProps): JSX.Element {
  const { data: incomes, isLoading } = useIncomes({ month });
  const confirm = useConfirmIncome();

  return (
    <StepLayout description="Confirmez vos revenus pour ce mois. Vous pouvez ajuster le montant si nécessaire.">
      <ItemList
        items={incomes}
        isLoading={isLoading}
        emptyState="Aucune source de revenu active pour ce mois."
        renderItem={(income) => (
          <EditableItem
            label={income.label}
            amount={income.amount}
            currency={income.currency}
            isPending={confirm.isPending && confirm.variables?.id === income.id}
            onConfirm={(amount) =>
              confirm.mutateAsync({ id: income.id, input: { month, amount } })
            }
          />
        )}
      />
    </StepLayout>
  );
}
