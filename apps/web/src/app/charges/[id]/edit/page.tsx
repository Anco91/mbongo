/**
 * Edit Charge Page
 *
 * Server Component rendering the charge edit form (one page, one
 * responsibility). The form fetches the charge client-side via the
 * domain hook (useCharge) — a dedicated prefetch guard is not required
 * for a single-record edit form.
 *
 * @module App/Charges/Edit
 */

import { ChargeEditForm } from '@/components/charges/charge-edit-form';
import { JSX } from 'react';

type Context = { params: Promise<{ id: string }> };

export default async function EditChargePage({
  params,
}: Context): Promise<JSX.Element> {
  const { id } = await params;
  return <ChargeEditForm chargeId={id} />;
}
