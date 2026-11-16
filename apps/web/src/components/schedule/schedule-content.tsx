/**
 * Schedule Content Component
 *
 * Client presentation (maquette list rows): white card, divided rows, one
 * line per upcoming due date — date, label, amount, account chip and
 * status badge. Merges persisted PENDING payments of the 60-day window
 * with virtual card billing entries (encours carte, M2 D1 — computed by
 * the pure `cardBilling` function, never persisted). A persisted row
 * opens its detail page (one page, one responsibility).
 *
 * @module Components/Schedule/ScheduleContent
 */

'use client';

import { usePayments, useTransactions } from '@/hooks/use-schedule';
import { useCharges } from '@/hooks/use-charges';
import { useAccounts } from '@/hooks/use-accounts';
import {
  cardBilling,
  isDue,
  type Payment,
  type PaymentDisplayStatus,
} from '@mbongo/shared';
import { addDays, startOfDay } from 'date-fns';
import Link from 'next/link';
import { JSX, useMemo } from 'react';
import { formatAmount, formatDate } from '@/components/common/format';
import { StatusBadge, AccountChip } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IconPlus } from '@/components/common/icons';

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

export function ScheduleContent(): JSX.Element {
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

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span>Chargement de l&apos;échéancier…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <h3 className="mb-2 font-semibold text-red-700">
          Erreur lors du chargement de l&apos;échéancier
        </h3>
        <p className="mb-3 text-sm text-red-600">{error.message}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void refetch();
          }}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        60 prochains jours — échéances et encours carte.
      </p>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-8 text-center">
          <h3 className="mb-2 text-base font-semibold text-slate-800">
            Aucune échéance à venir
          </h3>
          <p className="mb-4 text-sm text-slate-600">
            Créez une charge pour voir son échéancier ici.
          </p>
          <Link href="/charges/new" className="inline-block">
            <Button size="sm">
              <IconPlus className="h-4 w-4" /> Créer une charge
            </Button>
          </Link>
        </div>
      ) : (
        <Card>
          <CardContent className="divide-y divide-slate-100 pt-2">
            {rows.map((row) => (
              <ScheduleRowView key={row.key} row={row} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ScheduleRowView({ row }: { row: ScheduleRow }): JSX.Element {
  const body = (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-slate-800">
          {row.label}
        </p>
        <p className="shrink-0 text-sm font-semibold text-slate-900">
          {formatAmount(row.amount, row.currency)}
        </p>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <StatusBadge status={row.status === 'DUE' ? 'Dû' : 'À venir'} />
        <AccountChip name={row.accountLabel} />
        <span className="text-xs text-slate-400">
          {formatDate(row.dueDate.toISOString())}
        </span>
        {row.settlementLabel && (
          <span className="truncate text-xs text-slate-400">
            prélèvement sur {row.settlementLabel}
          </span>
        )}
      </div>
    </div>
  );

  // Une échéance virtuelle (encours carte) n'est pas rapprochable : pas de
  // lien, seule la carte la porte visuellement.
  if (!row.payment) {
    return <div className="bg-amber-50/40">{body}</div>;
  }
  return (
    <Link
      href={`/schedule/${row.payment.id}`}
      className="block transition-colors hover:bg-slate-50"
    >
      {body}
    </Link>
  );
}
