/**
 * Transfers View Component
 *
 * Composition shell: page → View → Guard (children) → Content.
 * The Guard prefetches via the server-side service (R5) and renders
 * the client Content inside the hydration boundary.
 *
 * @module Components/Transfers/TransfersView
 */

import { TransfersGuard } from './transfers-guard';
import { TransfersContent } from './transfers-content';
import { JSX } from 'react';

export function TransfersView(): JSX.Element {
  return (
    <TransfersGuard>
      <TransfersContent />
    </TransfersGuard>
  );
}
