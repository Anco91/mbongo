/**
 * Payment Candidates — candidate transactions for one due date: same account,
 * amount ± 0,01, date ± 7 days, explicit selection only (M2, spec
 * payment-schedule). The pure `reconciliationCandidates` function does the
 * matching (design D5).
 *
 * @module Components/Payments/PaymentCandidates
 */

'use client';

import { JSX, useMemo } from 'react';
import type { Payment, Transaction } from '@mbongo/shared';
import { reconciliationCandidates } from '@mbongo/shared';
import { useReconcilePayment } from '@/hooks/use-schedule';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatAmount, formatDate } from '@/lib/format';
import { InlineError } from '@/components/patterns/inline-error';

interface PaymentCandidatesProps {
  payment: Payment;
  transactions: Transaction[];
  currency: string;
}

export function PaymentCandidates({
  payment,
  transactions,
  currency,
}: PaymentCandidatesProps): JSX.Element {
  const reconcile = useReconcilePayment();

  const candidates = useMemo(() => {
    if (payment.transactionId) return [];
    return reconciliationCandidates(payment, transactions);
  }, [payment, transactions]);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-800">Débits possibles</h2>
      <p className="text-xs text-slate-500">
        Même compte, montant proche et date proche.
      </p>
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucun débit correspondant. Enregistrez le débit puis revenez ici.
        </p>
      ) : (
        <Card>
          <CardContent className="divide-y divide-slate-100 pt-2">
            {candidates.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="text-sm text-slate-800">
                  {formatDate(transaction.date)} —{' '}
                  {formatAmount(transaction.amount, currency)}
                </span>
                <Button
                  size="sm"
                  onClick={() =>
                    reconcile.mutate({
                      id: payment.id,
                      transactionId: transaction.id,
                    })
                  }
                  disabled={reconcile.isPending}
                >
                  Lier au débit
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {reconcile.error && <InlineError message={reconcile.error.message} />}
    </div>
  );
}
