/**
 * Budget Preparation Card
 *
 * Dashboard card showing monthly budget preparation status.
 * Three states: no account / to prepare / prepared.
 *
 * @module Components/Dashboard/Cards/BudgetPreparationCard
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMonthlyBudget } from '@/hooks/use-monthly-budget';
import { useAccounts } from '@/hooks/use-accounts';
import { currentMonthKey, monthLongLabel } from '@/lib/month-navigation';
import Link from 'next/link';
import { JSX } from 'react';

interface BudgetPreparationCardProps {
  selectedMonth: string;
  /** Total charges for the month, computed by useDashboardData. */
  totalCharges: number;
}

export function BudgetPreparationCard({
  selectedMonth,
  totalCharges,
}: BudgetPreparationCardProps): JSX.Element | null {
  // All hooks must be called unconditionally before any early returns
  const { data: accounts } = useAccounts();
  const { data: monthlyBudget } = useMonthlyBudget(selectedMonth);

  // Only show for current month
  const currentMonth = currentMonthKey();
  if (selectedMonth !== currentMonth) return null;

  // First launch: no active account
  const hasActiveAccount =
    accounts?.some((a) => a.status === 'ACTIVE') ?? false;
  if (!hasActiveAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Premier lancement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Créez votre premier compte pour commencer à préparer votre budget.
          </p>
          <Link href="/accounts/new">
            <Button>Créer un compte</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Fix: use != null (nullish check) instead of !== null (strict)
  // undefined !== null → true (bug), undefined != null → false (correct)
  const isPrepared = monthlyBudget?.preparedAt != null;
  const monthLabel = monthLongLabel(selectedMonth);

  if (isPrepared) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Budget de {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Ce mois a été préparé. Vous pouvez modifier les données si
            nécessaire.
          </p>
          <Link href={`/budget/${selectedMonth}`}>
            <Button variant="outline">Modifier</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // D10: Title includes "— à préparer" when not yet prepared
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Budget de {monthLabel} — à préparer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 mb-2">
          Total des charges : <strong>{totalCharges.toFixed(2)} CHF</strong>
        </p>
        <p className="text-sm text-slate-600 mb-4">
          Préparez votre budget mensuel en confirmant vos revenus et en ajustant
          vos charges.
        </p>
        <Link href={`/budget/${selectedMonth}`}>
          <Button>Préparer le mois</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
