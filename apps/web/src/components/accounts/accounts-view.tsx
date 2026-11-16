/**
 * Accounts View Component
 *
 * Composition shell: page → View → Guard (children) → Content.
 * The Guard prefetches via the server-side service (R5) and renders
 * the client Content inside the hydration boundary.
 *
 * @module Components/Accounts/AccountsView
 */

import { AccountsGuard } from './accounts-guard';
import { AccountsContent } from './accounts-content';
import { JSX } from 'react';

export function AccountsView(): JSX.Element {
  return (
    <AccountsGuard>
      <AccountsContent />
    </AccountsGuard>
  );
}
