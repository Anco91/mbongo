/**
 * Recap Step
 *
 * Step 4: Display budget summary with income, charges, and remaining amount.
 * Real sources only (design D1): the month's due dates come from the
 * windowed payments query, the income from the month's positive
 * transactions (excluding transfers) — never from the income sources.
 * Uses StepLayout for consistent spacing.
 *
 * @module Components/Budget/Steps/RecapStep
 */

'use client';

import { useMemo } from 'react';
import { useCharges } from '@/hooks/use-charges';
import { useAccounts } from '@/hooks/use-accounts';
import { useMonthlyBudget } from '@/hooks/use-monthly-budget';
import { useMonthPayments } from '@/hooks/use-schedule';
import { useMonthTransactions } from '@/hooks/use-transactions';
import { useDisplayCurrency } from '@/components/providers/display-currency-provider';
import { counterValue } from '@mbongo/shared';
import {
  computeMonthIncome,
  type MonthIncomeEntry,
  computeMonthlyBudget,
  type CurrencyConverter,
} from '@mbongo/shared';
import { monthKeyToDate } from '@/lib/month-navigation';
import { StepLayout } from './step-layout';
import { JSX } from 'react';

interface RecapStepProps {
  month: string;
}

export function RecapStep({ month }: RecapStepProps): JSX.Element {
  const { data: charges = [] } = useCharges();
  const { data: accounts = [] } = useAccounts();
  const { data: payments = [] } = useMonthPayments(month);
  const { data: transactions = [] } = useMonthTransactions(month);
  const { data: monthlyBudget } = useMonthlyBudget(month);
  // Display-currency shared context: the conversion composes the native
  // CHF→EUR counter-value with the EUR→display converter.
  const { rate, convert: convertEur, displayCurrency } = useDisplayCurrency();

  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );

  const convert: CurrencyConverter = useMemo(() => {
    const effectiveRate = rate && rate > 0 ? rate : 1;
    return (amount, currency) =>
      convertEur(
        currency === 'CHF' ? counterValue(amount, effectiveRate) : amount
      );
  }, [rate, convertEur]);

  // Income: the month's positive transactions, transfers excluded —
  // the transaction carries the native currency of its account.
  const incomeEntries: MonthIncomeEntry[] = useMemo(
    () =>
      transactions.map((t) => ({
        amount: t.amount,
        date: t.date,
        transferId: t.transferId,
        currency:
          accountsById.get(t.accountId)?.currency === 'CHF' ? 'CHF' : 'EUR',
      })),
    [transactions, accountsById]
  );

  const { total: totalIncome } = computeMonthIncome(
    incomeEntries,
    month,
    convert
  );

  // Charges: the month's due dates through the shared anti-double-counting
  // computation (provisioned charges count via their monthly provision).
  const {
    total: totalCharges,
    paymentsTotal,
    provisionsTotal,
  } = computeMonthlyBudget(charges, payments, monthKeyToDate(month), convert);

  const remaining = totalIncome - totalCharges;

  return (
    <StepLayout description="Récapitulatif de votre budget pour ce mois.">
      <div className="grid gap-4">
        <SummaryTile
          label="Revenus"
          value={`${totalIncome.toFixed(2)} ${displayCurrency}`}
          tone="positive"
        />
        <SummaryTile
          label="Échéances (hors provisions)"
          value={`${paymentsTotal.toFixed(2)} ${displayCurrency}`}
          tone="negative"
        />
        <SummaryTile
          label="Provisions"
          value={`${provisionsTotal.toFixed(2)} ${displayCurrency}`}
          tone="warning"
        />
        <SummaryTile
          label="Charges"
          value={`${totalCharges.toFixed(2)} ${displayCurrency}`}
          tone="negative"
        />
        <SummaryTile
          label="Reste à vivre"
          value={`${remaining.toFixed(2)} ${displayCurrency}`}
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
