/**
 * Échéance Detail Page
 *
 * Server Component rendering the PaymentDetailGuard (prefetch +
 * hydration) for one due date, with its reconciliation UI.
 *
 * @module App/Dashboard/Schedule/Detail
 */

import { PaymentDetailView } from '@/components/schedule/payment-detail-view';
import { JSX } from 'react';

type Context = { params: Promise<{ id: string }> };

export default async function EcheanceDetailPage({
  params,
}: Context): Promise<JSX.Element> {
  const { id } = await params;
  return <PaymentDetailView paymentId={id} />;
}
