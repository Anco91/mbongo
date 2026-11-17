/**
 * Household Page
 *
 * Server Component rendering the HouseholdView (prefetch + hydration).
 * La vue foyer liste les membres et permet de créer, modifier et
 * supprimer (M4, F8).
 *
 * @module App/Household
 */

import { HouseholdView } from '@/components/household/household-view';
import { JSX } from 'react';

export default function HouseholdPage(): JSX.Element {
  return <HouseholdView />;
}
