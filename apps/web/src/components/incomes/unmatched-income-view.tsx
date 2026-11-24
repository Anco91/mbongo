/**
 * Unmatched Income View Component
 *
 * Composition shell: page → View → Guard (children) → Content.
 *
 * @module Components/Incomes/UnmatchedIncomeView
 */

import { UnmatchedIncomeGuard } from './unmatched-income-guard';
import { UnmatchedIncomeContent } from './unmatched-income-content';
import { JSX } from 'react';

export function UnmatchedIncomeView(): JSX.Element {
  return (
    <UnmatchedIncomeGuard>
      <UnmatchedIncomeContent />
    </UnmatchedIncomeGuard>
  );
}
