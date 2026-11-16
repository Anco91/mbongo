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

import { useCallback, useEffect, useMemo, useState } from 'react';
import { computeAlerts, type Alert } from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useCharges } from '@/hooks/use-charges';
import { usePayments } from '@/hooks/use-schedule';
import { useBalances } from '@/hooks/use-balances';

const ALERTS_READ_KEY = 'mbongo.alertsRead';

/** Stable identity of an alert occurrence (id + triggering value/date). */
export function alertFingerprint(alert: Alert): string {
  return `${alert.id}|${alert.amount ?? ''}|${alert.date ?? ''}`;
}

/**
 * Active alerts (sorted by severity, as produced by computeAlerts).
 */
export function useActiveAlerts(): Alert[] {
  const { data: accounts = [] } = useAccounts();
  const { data: charges = [] } = useCharges();
  const { data: payments = [] } = usePayments();
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
  readIds: Set<string>;
  /** Marks every currently listed fingerprint as read. */
  markAllRead: (fingerprints: string[]) => void;
}

/**
 * Per-device read state, persisted in localStorage (`mbongo.alertsRead`).
 */
export function useAlertsRead(): AlertsReadState {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ALERTS_READ_KEY);
      if (raw) {
        setReadIds(new Set(JSON.parse(raw) as string[]));
      }
    } catch {
      // Unreadable storage: start empty (all alerts count as unread).
    }
  }, []);

  const markAllRead = useCallback((fingerprints: string[]): void => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const fp of fingerprints) next.add(fp);
      try {
        window.localStorage.setItem(ALERTS_READ_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore persistence failure: the state stays valid for the session.
      }
      return next;
    });
  }, []);

  return { readIds, markAllRead };
}
