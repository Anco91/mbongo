/**
 * useScheduleRows — merges persisted PENDING payments of the 60-day window
 * with virtual card billing entries (encours carte, M2 D1 — computed by the
 * pure `cardBilling` function, never persisted). The render receives ready
 * rows (design D5).
 *
 * @module Components/Schedule/UseScheduleRows
 */

'use client';

import { useMemo } from 'react';
import {
  cardBilling,
  isDue,
  type Payment,
  type PaymentDisplayStatus,
} from '@mbongo/shared';
import { addDays, startOfDay } from 'date-fns';
import { usePayments, useTransactions } from '@/hooks/use-schedule';
import { useCharges } from '@/hooks/use-charges';
import { useAccounts } from '@/hooks/use-accounts';
import { buildAccountsMap, buildChargesMap } from '@/lib/filters';

/**
 * One line of the schedule: a persisted payment or a virtual card entry.
 */
export interface ScheduleRow {
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

export interface ScheduleRowsView {
  rows: ScheduleRow[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useScheduleRows(): ScheduleRowsView {
  const today = startOfDay(new Date());
  const windowEnd = addDays(today, 60);

  const { data: payments = [], isLoading, error, refetch } = usePayments();
  const { data: charges = [] } = useCharges();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();

  const chargesById = useMemo(() => buildChargesMap(charges), [charges]);
  const accountsById = useMemo(() => buildAccountsMap(accounts), [accounts]);

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

  return {
    rows,
    isLoading,
    error: error ?? null,
    refetch: () => {
      void refetch();
    },
  };
}
