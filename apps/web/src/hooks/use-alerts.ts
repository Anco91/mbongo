/**
 * Use Alerts Hooks
 *
 * Client alerts layer on top of the pure `computeAlerts`:
 * - `useActiveAlerts` — active alerts from the prefetched data;
 * - `useAlertsRead` — per-device read state (localStorage set of alert
 *   fingerprints), so the bell badge only counts unread alerts.
 *
 * An alert fingerprint is `{id}|{amount}|{date}`: deterministic per
 * entity, and it changes when the condition's value moves (e.g. the
 * balance falls further into overdraft), so a re-triggered condition
 * reappears as unread while a stable alert stays read.
 *
 * @module Hooks/UseAlerts
 */

'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { format } from 'date-fns';
import { computeAlerts, type Alert } from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useCharges } from '@/hooks/use-charges';
import { usePayments } from '@/hooks/use-schedule';
import { useBalances } from '@/hooks/use-balances';
import { alertsPaymentsQuery } from '@/lib/month-queries';
import {
  getServerSnapshot as getStoreServerSnapshot,
  getSnapshot as getStoreSnapshot,
  markAllRead as markAllReadInStore,
  subscribe as subscribeToStore,
} from '@/lib/alerts-read-store';

/** Stable identity of an alert occurrence (id + triggering value/date). */
export function alertFingerprint(alert: Alert): string {
  return `${alert.id}|${alert.amount ?? ''}|${alert.date ?? ''}`;
}

/**
 * Active alerts (sorted by severity, as produced by computeAlerts).
 *
 * Payments are windowed (design D5): every PENDING due date up to D+30
 * — overdue history plus the 30-day forecast — with a day-stable query
 * key instead of the global truncated list.
 */
export function useActiveAlerts(): Alert[] {
  const { data: accounts = [] } = useAccounts();
  const { data: charges = [] } = useCharges();
  // Day key 'YYYY-MM-DD': the derived bounds (and the query key) stay
  // stable within the day, so no midnight refetch churn.
  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const { data: payments = [] } = usePayments(
    useMemo(() => alertsPaymentsQuery(todayKey), [todayKey])
  );
  const balances = useBalances();

  return useMemo(
    () =>
      computeAlerts({
        accounts,
        balances,
        payments,
        charges,
      }),
    [accounts, balances, payments, charges]
  );
}

interface AlertsReadState {
  /** Fingerprints already read on this device. */
  readIds: ReadonlySet<string>;
  /** Marks every currently listed fingerprint as read. */
  markAllRead: (fingerprints: string[]) => void;
}

/**
 * Per-device read state, persisted in localStorage (`mbongo.alertsRead`)
 * through the shared external store: every mounted consumer (header
 * bell, dedicated view) sees the same snapshot without a reload.
 */
export function useAlertsRead(): AlertsReadState {
  const readIds = useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    getStoreServerSnapshot
  );

  return { readIds, markAllRead: markAllReadInStore };
}
