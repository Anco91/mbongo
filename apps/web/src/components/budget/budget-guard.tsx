/**
 * Budget Guard
 *
 * Client component that wraps the budget wizard.
 * Handles prefetch and hydration.
 *
 * @module Components/Budget/BudgetGuard
 */

'use client';

import { BudgetView } from './budget-view';
import { JSX } from 'react';

interface BudgetGuardProps {
  month: string;
  monthLabel: string;
}

export function BudgetGuard({
  month,
  monthLabel,
}: BudgetGuardProps): JSX.Element {
  return <BudgetView month={month} monthLabel={monthLabel} />;
}
