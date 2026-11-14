/**
 * Payment Detail View Component
 *
 * Client-side reconciliation UI for one due date (M2, spec
 * payment-schedule) :
 * - derived visible status (à venir / dû / payé) — never stored ;
 * - candidates list computed by the pure `reconciliationCandidates`
 *   function, explicit selection only (no automatic link) ;
 * - manual check without transaction (espèces), reconciliation still
 *   possible afterwards ;
 * - unlink (dérapprochement) back to PENDING.
 *
 * @module Components/Schedule/PaymentDetailView
 */

'use client';

import {
  usePayment,
  useReconcilePayment,
  useTransactions,
  useUnlinkPayment,
  useUpdatePayment,
} from './hooks/use-schedule';
import { useCharge } from '@/components/charges/hooks/use-charges';
import { useAccount } from '@/components/accounts/hooks/use-accounts';
import { paymentDisplayStatus, reconciliationCandidates } from '@mbongo/shared';
import { addDays, format, parseISO } from 'date-fns';
import Link from 'next/link';
import { JSX, useMemo } from 'react';

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: 'À venir',
  DUE: 'Dû',
  PAID: 'Payé',
  CANCELLED: 'Annulé',
  FAILED: 'Échec',
};

/**
 * PaymentDetailView Component
 */
export function PaymentDetailView({
  paymentId,
  accountId,
}: {
  paymentId: string;
  accountId: string;
}): JSX.Element {
  const { data: payment, isLoading, error } = usePayment(paymentId);
  const { data: charge } = useCharge(payment?.chargeId ?? '');
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
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <h3 className="font-semibold text-red-700 mb-2">
          Erreur lors du chargement de l&apos;échéance
        </h3>
        <p className="text-red-600 mb-4">{error?.message ?? 'Inconnue'}</p>
        <Link
          href="/echeancier"
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Retour à l&apos;échéancier
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {charge?.label ?? 'Échéance'}
          </h1>
          <p className="text-sm text-gray-500">
            Échéance du {format(parseISO(payment.dueDate), 'dd/MM/yyyy')} —{' '}
            {account?.name ?? 'Compte inconnu'}
          </p>
        </div>
        <Link
          href="/echeancier"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Retour
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Montant</p>
            <p className="text-xl font-semibold text-gray-900">
              {formatAmount(payment.amount, payment.currency)}
            </p>
          </div>
          <span
            className={
              status === 'DUE'
                ? 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full'
                : status === 'PAID'
                  ? 'px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full'
                  : 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
            }
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>

        {payment.paidAt && (
          <p className="text-sm text-gray-500">
            Payé le {format(parseISO(payment.paidAt), 'dd/MM/yyyy')}
          </p>
        )}

        {linked ? (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 space-y-2">
            <p className="text-sm text-emerald-800">
              Rapprochée de la transaction du{' '}
              {format(parseISO(linked.date), 'dd/MM/yyyy')} (
              {formatAmount(
                linked.amount,
                account?.currency ?? payment.currency
              )}
              )
            </p>
            <button
              onClick={() => unlink.mutate(payment.id)}
              disabled={unlink.isPending}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {unlink.isPending ? 'Dérapprochement…' : 'Dérapprocher'}
            </button>
            {unlink.error && <ErrorLine message={unlink.error.message} />}
          </div>
        ) : (
          <>
            {status !== 'PAID' && (
              <button
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
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {updatePayment.isPending
                  ? 'Enregistrement…'
                  : 'Marquer payée sans transaction'}
              </button>
            )}
            {updatePayment.error && (
              <ErrorLine message={updatePayment.error.message} />
            )}
          </>
        )}

        {canReconcile && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700">
              Transactions candidates
            </h2>
            <p className="text-xs text-gray-500">
              Même compte, montant à ± 0,01, date à ± 7 jours — sélection
              manuelle uniquement.
            </p>
            {candidates.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aucune candidate — saisissez la transaction puis revenez ici.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {candidates.map((transaction) => (
                  <li
                    key={transaction.id}
                    className="flex justify-between items-center px-4 py-3 bg-white"
                  >
                    <span className="text-sm text-gray-900">
                      {format(parseISO(transaction.date), 'dd/MM/yyyy')} —{' '}
                      {formatAmount(
                        transaction.amount,
                        account?.currency ?? payment.currency
                      )}
                    </span>
                    <button
                      onClick={() =>
                        reconcile.mutate({
                          id: payment.id,
                          transactionId: transaction.id,
                        })
                      }
                      disabled={reconcile.isPending}
                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      Rapprocher
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {reconcile.error && <ErrorLine message={reconcile.error.message} />}
          </div>
        )}
      </div>
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

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
  }).format(amount);
}
