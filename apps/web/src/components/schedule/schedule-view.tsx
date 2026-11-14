/**
 * Schedule View Component
 *
 * Client-side view: the single list of upcoming due dates across all
 * charges (spec payment-schedule). Merges:
 * - persisted PENDING payments of the 60-day window (including already
 *   passed ones, shown with their derived « dû » status) ;
 * - virtual card billing entries (encours carte, M2 D1) computed by the
 *   pure `cardBilling` function — never persisted.
 *
 * @module Components/Schedule/ScheduleView
 */

'use client';

import { usePayments, useTransactions } from './hooks/use-schedule';
import { useCharges } from '@/components/charges/hooks/use-charges';
import { useAccounts } from '@/components/accounts/hooks/use-accounts';
import {
  cardBilling,
  isDue,
  type Payment,
  type PaymentDisplayStatus,
} from '@mbongo/shared';
import { addDays, format, startOfDay } from 'date-fns';
import Link from 'next/link';
import { JSX, useMemo } from 'react';

/**
 * One line of the schedule: a persisted payment or a virtual card entry.
 */
interface ScheduleRow {
  /** Stable React key. */
  key: string;
  /** Persisted payment, or null for a virtual card entry. */
  payment: Payment | null;
  label: string;
  amount: number;
  currency: string;
  accountLabel: string;
  /** For a virtual entry: the settlement account label. */
  settlementLabel: string | null;
  dueDate: Date;
  status: Extract<PaymentDisplayStatus, 'UPCOMING' | 'DUE'>;
}

/**
 * ScheduleView Component
 *
 * @example
 * ```tsx
 * // Used inside ScheduleGuard:
 * <ScheduleView />
 * ```
 */
export function ScheduleView(): JSX.Element {
  const today = startOfDay(new Date());
  const windowEnd = addDays(today, 60);

  const { data: payments = [], isLoading, error, refetch } = usePayments();
  const { data: charges = [] } = useCharges();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();

  const chargesById = useMemo(
    () => new Map(charges.map((charge) => [charge.id, charge])),
    [charges]
  );
  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );

  const rows = useMemo((): ScheduleRow[] => {
    const inWindow = payments.filter(
      (payment) => new Date(payment.dueDate).getTime() <= windowEnd.getTime()
    );
    const persisted: ScheduleRow[] = inWindow.map((payment) => {
      const charge = chargesById.get(payment.chargeId);
      const account = accountsById.get(charge?.accountId ?? '');
      return {
        key: payment.id,
        payment,
        label: charge?.label ?? 'Charge inconnue',
        amount: payment.amount,
        currency: payment.currency,
        accountLabel: account?.name ?? 'Compte inconnu',
        settlementLabel: null,
        dueDate: new Date(payment.dueDate),
        status: isDue(payment, new Date()) ? 'DUE' : 'UPCOMING',
      };
    });

    // Échéances virtuelles carte (M2 D1) : calculées, jamais persistées.
    const virtual: ScheduleRow[] = accounts
      .filter(
        (account) =>
          account.accountType === 'CREDIT_CARD' || account.deferredCard
      )
      .map((account) =>
        cardBilling(
          account,
          transactions.filter((t) => t.accountId === account.id),
          new Date()
        )
      )
      .filter(
        (billing) =>
          billing.encours > 0 &&
          billing.nextBillingDate !== null &&
          billing.nextBillingDate.getTime() <= windowEnd.getTime()
      )
      .map((billing) => {
        const settlement = accountsById.get(billing.settlementAccountId);
        const card = accounts.find((a) => a.id === billing.settlementAccountId);
        return {
          key: `virtual:${settlement?.id ?? ''}`,
          payment: null,
          label: card?.name ?? 'Carte',
          amount: billing.encours,
          currency: card?.currency ?? 'CHF',
          accountLabel: settlement?.name ?? 'Règlement',
          settlementLabel: settlement?.name ?? null,
          dueDate: billing.nextBillingDate as Date,
          status: 'UPCOMING' as const,
        };
      });

    return [...persisted, ...virtual].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );
  }, [payments, accounts, transactions, chargesById, accountsById, windowEnd]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span>Chargement de l&apos;échéancier…</span>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 border border-red-300 rounded-lg bg-red-50">
        <h3 className="font-semibold text-red-700 mb-2">
          Erreur lors du chargement de l&apos;échéancier
        </h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={() => {
            void refetch();
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Échéancier</h1>
          <p className="text-sm text-gray-500">
            60 prochains jours — échéances et encours carte
          </p>
        </div>
        <Link
          href="/charges"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Charges
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="p-8 text-center border border-gray-200 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Aucune échéance à venir
          </h3>
          <p className="text-gray-600 mb-6">
            Créez une charge pour voir son échéancier ici.
          </p>
          <Link
            href="/charges/nouveau"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Créer une charge
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Charge
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compte débité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => (
                <ScheduleRowView key={row.key} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ScheduleRowView({ row }: { row: ScheduleRow }): JSX.Element {
  const content = (
    <>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {format(row.dueDate, 'dd/MM/yyyy')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {row.payment ? (
          <Link
            href={`/echeancier/${row.payment.id}`}
            className="text-indigo-600 hover:text-indigo-900"
          >
            {row.label}
          </Link>
        ) : (
          <>
            {row.label}
            {row.settlementLabel && (
              <span className="ml-2 text-xs text-gray-500">
                (prélèvement sur {row.settlementLabel})
              </span>
            )}
          </>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatAmount(row.amount, row.currency)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {row.accountLabel}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span
          className={
            row.status === 'DUE'
              ? 'px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full'
              : 'px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
          }
        >
          {row.status === 'DUE' ? 'Dû' : 'À venir'}
        </span>
      </td>
    </>
  );

  // Une échéance virtuelle (encours carte) n'est pas rapprochable : pas de lien.
  if (!row.payment) {
    return <tr className="bg-amber-50/40">{content}</tr>;
  }
  return <tr className="hover:bg-gray-50">{content}</tr>;
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
  }).format(amount);
}
