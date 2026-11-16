/**
 * Charges View Component
 *
 * Composition shell: page → View → Guard (children) → Content.
 * The Guard prefetches via the server-side service (R5) and renders
 * the client Content inside the hydration boundary.
 *
 * @module Components/Charges/ChargesView
 */

import { ChargesGuard } from './charges-guard';
import { ChargesContent } from './charges-content';
import { JSX } from 'react';

export function ChargesView(): JSX.Element {
  return (
    <ChargesGuard>
      <ChargesContent />
    </ChargesGuard>
  );
}
