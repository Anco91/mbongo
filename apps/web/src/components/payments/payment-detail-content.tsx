/**
 * Payment Detail Content Component
 *
 * Client presentation of the reconciliation screen for one due date
 * (M2, spec payment-schedule) — on the shared primitives, no local
 * styles:
 * - derived visible status (à venir / dû / payé) — never stored ;
 * - debit candidates computed by the pure `reconciliationCandidates`
 *   function, explicit selection only (no automatic link) ;
 * - manual check without transaction (espèces), reconciliation still
 *   possible afterwards ;
 * - unlink back to PENDING.
 *
 * Actions live in `payment-actions`, candidates in `payment-schedule`
 * (design D5).
 *
 * @module Components/Payments/PaymentDetailContent
 */

'use client';

import { usePayment, useTransactions } from '@/hooks/use-schedule';
import { useCharge } from '@/hooks/use-charges';
import { useAccount } from '@/hooks/use-accounts';
import { paymentDisplayStatus } from '@mbongo/shared';
import { addDays, parseISO } from 'date-fns';
import { JSX } from 'react';
import { formatAmount, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui';
import { LoadingState, ErrorPanel } from '@/components/patterns/async-state';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { PaymentReconcileActions } from '@/components/payments/payment-reconcile-actions';
import { PaymentCandidates } from '@/components/payments/payment-candidates';

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: 'À venir',
  DUE: 'Dû',
  PAID: 'Payé',
  CANCELLED: 'Annulé',
  FAILED: 'Échec',
};

export function PaymentDetailContent({
  paymentId,
}: {
  paymentId: string;
}): JSX.Element {
  const { data: payment, isLoading, error, refetch } = usePayment(paymentId);
  const { data: charge } = useCharge(payment?.chargeId ?? '');
  const accountId = charge?.accountId ?? '';
  const { data: account } = useAccount(accountId);
  const { data: transactions = [] } = useTransactions(
    payment ? transactionQuery(accountId, payment.dueDate) : {}
  );

  if (isLoading) {
    return <LoadingState label="Chargement de l'échéance…" />;
  }

  if (Boolean(error) || !payment) {
    return (
      <ErrorPanel
        title="Impossible de charger l’échéance"
        message={error?.message ?? 'Inconnue'}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const status = paymentDisplayStatus(payment, new Date());
  const linked = payment.transactionId
    ? transactions.find((t) => t.id === payment.transactionId)
    : undefined;
  // Une échéance PAID sans transaction (coche manuelle) reste rapprochable.
  const canReconcile = status !== 'CANCELLED' && status !== 'FAILED';
  const currency = account?.currency ?? payment.currency;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              {formatAmount(payment.amount, payment.currency)}
            </p>
            <StatusBadge status={STATUS_LABELS[status] ?? status} />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Échéance du {formatDate(payment.dueDate)} —{' '}
            {account?.name ?? 'Compte inconnu'}
          </p>
          {payment.paidAt && (
            <p className="mt-1 text-xs text-slate-400">
              Payé le {formatDate(payment.paidAt)}
            </p>
          )}

          <Separator className="my-3" />

          <PaymentReconcileActions
            payment={payment}
            linked={linked}
            currency={currency}
            isPaid={status === 'PAID'}
          />
        </CardContent>
      </Card>

      {canReconcile && (
        <PaymentCandidates
          payment={payment}
          transactions={transactions}
          currency={currency}
        />
      )}
    </div>
  );
}

function transactionQuery(
  accountId: string,
  dueDate: string
): { accountId: { eq: string }; dateFrom: string; dateTo: string } {
  const due = parseISO(dueDate);
  return {
    accountId: { eq: accountId },
    dateFrom: addDays(due, -60).toISOString(),
    dateTo: addDays(due, 60).toISOString(),
  };
}
