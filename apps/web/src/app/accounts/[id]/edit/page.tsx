/**
 * Edit Account Page
 *
 * Server Component rendering the account edit form (one page, one
 * responsibility). The form fetches the account client-side via the
 * domain hook (useAccount) — a dedicated prefetch guard is not required
 * for a single-record edit form.
 *
 * @module App/Accounts/Edit
 */

import { AccountEditForm } from '@/components/accounts/account-edit-form';
import { JSX } from 'react';

type Context = { params: Promise<{ id: string }> };

export default async function EditAccountPage({
  params,
}: Context): Promise<JSX.Element> {
  const { id } = await params;
  return <AccountEditForm accountId={id} />;
}
