/**
 * Payment Detail View Component
 *
 * Composition shell: page → View → Guard (children) → Content.
 * The Guard guarantees the payment, its charge, its account and the
 * candidate transactions before render.
 *
 * @module Components/Payments/PaymentDetailView
 */

import { PaymentDetailGuard } from './payment-detail-guard';
import { PaymentDetailContent } from './payment-detail-content';
import { JSX } from 'react';

export function PaymentDetailView({
  paymentId,
}: {
  paymentId: string;
}): JSX.Element {
  return (
    <PaymentDetailGuard id={paymentId}>
      <PaymentDetailContent paymentId={paymentId} />
    </PaymentDetailGuard>
  );
}
