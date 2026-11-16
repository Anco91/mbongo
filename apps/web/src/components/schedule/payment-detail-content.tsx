/**
 * Payment Detail Content Component
 *
 * Client presentation of the reconciliation screen for one due date
 * (M2, spec payment-schedule) — on the shared primitives, no local
 * styles:
 * - derived visible status (à venir / dû / payé) — never stored ;
 * - candidates list computed by the pure `reconciliationCandidates`
 *   function, explicit selection only (no automatic link) ;
 * - manual check without transaction (espèces), reconciliation still
 *   possible afterwards ;
 * - unlink (dérapprochement) back to PENDING.
 *
 * @module Components/Schedule/PaymentDetailContent
 */

'use client';

import {
  usePayment,
  useReconcilePayment,
  useTransactions,
  useUnlinkPayment,
  useUpdatePayment,
} from '@/hooks/use-schedule';
import { useCharge } from '@/hooks/use-charges';
import { useAccount } from '@/hooks/use-accounts';
import { paymentDisplayStatus, reconciliationCandidates } from '@mbongo/shared';
import { addDays, parseISO } from 'date-fns';
import Link from 'next/link';
import { JSX, useMemo } from 'react';
import { formatAmount, formatDate } from '@/components/common/format';
import { StatusBadge } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
  const { data: payment, isLoading, error } = usePayment(paymentId);
  const { data: charge } = useCharge(payment?.chargeId ?? '');
  const accountId = charge?.accountId ?? '';
  const { data: account } = useAccount(accountId);
  const { data: transactions = [] } = useTransactions(
    payment ? transactionQuery(accountId, payment.dueDate) : {}
  );
  const reconcile = useReconcilePayment();
  const unlink = useUnlinkPayment();
  const updatePayment = useUpdatePayment();

  const candidates = useMemo(() => {
    if (!payment || payment.transactionId) return [];
    return reconciliationCandidates(payment, transactions);
  }, [payment, transactions]);

  if (isLoading) {
    return (
      <div className="p-4">
        <span>Chargement de l&apos;échéance…</span>
      </div>
    );
  }

  if (Boolean(error) || !payment) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <h3 className="mb-2 font-semibold text-red-700">
          Erreur lors du chargement de l&apos;échéance
        </h3>
        <p className="mb-3 text-sm text-red-600">
          {error?.message ?? 'Inconnue'}
        </p>
        <Link href="/schedule" className="inline-block">
          <Button variant="outline" size="sm">
            Retour à l&apos;échéancier
          </Button>
        </Link>
      </div>
    );
  }

  const status = paymentDisplayStatus(payment, new Date());
  const linked = payment.transactionId
    ? transactions.find((t) => t.id === payment.transactionId)
    : undefined;
  // Une échéance PAID sans transaction (coche manuelle) reste rapprochable.
  const canReconcile = status !== 'CANCELLED' && status !== 'FAILED';

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

          {linked ? (
            <div className="space-y-2">
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
                <p className="text-sm text-emerald-800">
                  Rapprochée de la transaction du {formatDate(linked.date)} (
                  {formatAmount(
                    linked.amount,
                    account?.currency ?? payment.currency
                  )}
                  )
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
              {unlink.error && <ErrorLine message={unlink.error.message} />}
            </div>
          ) : (
            <>
              {status !== 'PAID' && (
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
                <ErrorLine message={updatePayment.error.message} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {canReconcile && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Transactions candidates
          </h2>
          <p className="text-xs text-slate-500">
            Même compte, montant à ± 0,01, date à ± 7 jours — sélection manuelle
            uniquement.
          </p>
          {candidates.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucune candidate — saisissez la transaction puis revenez ici.
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
                      {formatAmount(
                        transaction.amount,
                        account?.currency ?? payment.currency
                      )}
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
                      Rapprocher
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {reconcile.error && <ErrorLine message={reconcile.error.message} />}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ErrorLine({ message }: { message: string }): JSX.Element {
  return (
    <p className="text-sm text-red-600" role="alert">
      {message}
    </p>
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
