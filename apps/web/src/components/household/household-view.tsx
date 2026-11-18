/**
 * Household View Component
 *
 * Composition shell: page → Guard (children) → Content (M4, vue foyer).
 *
 * @module Components/Household/HouseholdView
 */

import { HouseholdGuard } from './household-guard';
import { HouseholdContent } from './household-content';
import { JSX } from 'react';

export function HouseholdView(): JSX.Element {
  return (
    <HouseholdGuard>
      <HouseholdContent />
    </HouseholdGuard>
  );
}
