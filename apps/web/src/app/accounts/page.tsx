/**
 * Accounts Page
 *
 * Server Component rendering the AccountsGuard (prefetch + hydration).
 *
 * @module App/Dashboard/Accounts
 */

import { AccountsView } from '@/components/accounts/accounts-view';
import { JSX } from 'react';

export default function AccountsPage(): JSX.Element {
  return <AccountsView />;
}
