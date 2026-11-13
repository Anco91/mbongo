/**
 * Accounts Page
 *
 * Server Component rendering the AccountsGuard (prefetch + hydration).
 *
 * @module App/Dashboard/Accounts
 */

import { AccountsGuard } from '@/components/accounts/accounts-guard';
import { JSX } from 'react';

export default function AccountsPage(): JSX.Element {
  return <AccountsGuard />;
}
