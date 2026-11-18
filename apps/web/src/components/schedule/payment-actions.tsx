/**
 * Payment Actions — the reconciliation state of one due date: either the
 * linked transaction with its unlink action, or the manual « mark paid »
 * action (M2, spec payment-schedule). Mutations and their pending/error
 * state stay local to this component (design D5).
 *
 * @module Components/Schedule/PaymentActions
 */

'use client';

import { JSX } from 'react';
import type { Payment, Transaction } from '@mbongo/shared';
import { useUnlinkPayment, useUpdatePayment } from '@/hooks/use-schedule';
import { Button } from '@/components/ui/button';
import { formatAmount, formatDate } from '@/components/common/format';
import { InlineError } from '@/components/common/inline-error';

interface PaymentActionsProps {
  payment: Payment;
  linked: Transaction | undefined;
  currency: string;
  isPaid: boolean;
}

export function PaymentActions({
  payment,
  linked,
  currency,
  isPaid,
}: PaymentActionsProps): JSX.Element {
  const unlink = useUnlinkPayment();
  const updatePayment = useUpdatePayment();

  if (linked) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
          <p className="text-sm text-emerald-800">
            Rapprochée de la transaction du {formatDate(linked.date)} (
            {formatAmount(linked.amount, currency)})
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => unlink.mutate(payment.id)}
          disabled={unlink.isPending}
        >
          {unlink.isPending ? 'Dérapprochement…' : 'Dérapprocher'}
        </Button>
        {unlink.error && <InlineError message={unlink.error.message} />}
      </div>
    );
  }

  return (
    <>
      {!isPaid && (
        <Button
          size="sm"
          className="w-full"
          onClick={() =>
            updatePayment.mutate({
              id: payment.id,
              input: {
                status: 'PAID',
                paidAt: new Date().toISOString(),
              },
            })
          }
          disabled={updatePayment.isPending}
        >
          {updatePayment.isPending
            ? 'Enregistrement…'
            : 'Marquer payée sans transaction'}
        </Button>
      )}
      {updatePayment.error && (
        <InlineError message={updatePayment.error.message} />
      )}
    </>
  );
}
