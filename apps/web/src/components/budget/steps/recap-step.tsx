/**
 * Recap Step
 *
 * Step 4: Display budget summary with income, charges, and remaining amount.
 * Uses StepLayout for consistent spacing.
 *
 * @module Components/Budget/Steps/RecapStep
 */

'use client';

import { useIncomes } from '@/hooks/use-incomes';
import { useCharges } from '@/hooks/use-charges';
import { useMonthlyBudget } from '@/hooks/use-monthly-budget';
import {
  computeMonthIncome,
  MonthIncomeEntry,
  computeMonthlyBudget,
} from '@mbongo/shared';
import { monthKeyToDate } from '@/lib/month-navigation';
import { StepLayout } from './step-layout';
import { JSX } from 'react';

interface RecapStepProps {
  month: string;
}

export function RecapStep({ month }: RecapStepProps): JSX.Element {
  const { data: incomes } = useIncomes({ month });
  const { data: charges } = useCharges();
  const { data: monthlyBudget } = useMonthlyBudget(month);

  // Calculate total income for the month
  const incomeEntries: MonthIncomeEntry[] = (incomes ?? []).map((income) => ({
    amount: income.amount,
    date: income.startDate,
    transferId: null,
    currency: income.currency as 'CHF' | 'EUR',
  }));

  const { total: totalIncome } = computeMonthIncome(incomeEntries, month);

  // Calculate total charges for the month
  const monthDate = monthKeyToDate(month);
  const { total: totalCharges } = computeMonthlyBudget(
    charges ?? [],
    [],
    monthDate
  );

  const remaining = totalIncome - totalCharges;

  return (
    <StepLayout description="Récapitulatif de votre budget pour ce mois.">
      <div className="grid gap-4">
        <SummaryTile
          label="Revenus"
          value={`${totalIncome.toFixed(2)} CHF`}
          tone="positive"
        />
        <SummaryTile
          label="Charges"
          value={`${totalCharges.toFixed(2)} CHF`}
          tone="negative"
        />
        <SummaryTile
          label="Reste à vivre"
          value={`${remaining.toFixed(2)} CHF`}
          tone={remaining >= 0 ? 'neutral' : 'warning'}
        />
      </div>

      {monthlyBudget?.preparedAt && (
        <p className="text-sm text-slate-600 italic">
          Ce mois a déjà été préparé le{' '}
          {new Date(monthlyBudget.preparedAt).toLocaleDateString('fr-FR')}.
        </p>
      )}
    </StepLayout>
  );
}

/** Budget summary tile with semantic color tones. */
function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'positive' | 'negative' | 'neutral' | 'warning';
}): JSX.Element {
  const styles = {
    positive: 'bg-green-50 border-green-200 text-green-800',
    negative: 'bg-red-50 border-red-200 text-red-800',
    neutral: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
  } as const;

  const valueStyles = {
    positive: 'text-green-900',
    negative: 'text-red-900',
    neutral: 'text-blue-900',
    warning: 'text-orange-900',
  } as const;

  return (
    <div className={`p-4 border rounded-lg ${styles[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className={`text-2xl font-bold ${valueStyles[tone]}`}>{value}</p>
    </div>
  );
}
