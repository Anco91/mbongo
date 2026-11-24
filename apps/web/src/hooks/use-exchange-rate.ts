/**
 * Exchange Rate Hook
 *
 * Sources the current EUR↔CHF rate for the display consolidation:
 - live rate from Frankfurter (official ECB rate, no key, CORS open),
 * cached in the React Query session cache for 12 h;
 * - fallback to the latest known rate from transfers when the API is
 * unavailable.
 *
 * Rate convention follows the app's `counterValue`: the rate converts
 * CHF → EUR (ex. 0.9231). Frankfurter returns EUR → CHF, hence 1/rates.CHF.
 *
 * The fusion lives in the pure `resolveRate` (shared) — no invented rate:
 * `null` when nothing is available.
 *
 * @module Hooks/UseExchangeRate
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { resolveRate } from '@mbongo/shared';
import { exchangeRateQueries } from '@/queries/exchange-rate';
import { useTransfers } from '@/hooks/use-transfers';

export interface ExchangeRateState {
  /** CHF → EUR rate (counterValue convention), or null when unavailable. */
  rate: number | null;
  /** ISO date of the rate (API day or transfer date). */
  rateDate: string | null;
  /** live = official API · fallback = last known transfer · none = nothing. */
  source: 'live' | 'fallback' | 'none';
  /** True while the live fetch has not resolved yet. */
  isLoading: boolean;
}

/**
 * Fetch the official rate at dashboard load, fall back to transfers.
 * Client-only: no server route, no key, no DB persistence.
 */
export function useExchangeRate(): ExchangeRateState {
  const { data: transfers = [] } = useTransfers();

  const liveQuery = useQuery(exchangeRateQueries.latest());

  const resolved = useMemo(
    () => resolveRate(liveQuery.data ?? null, transfers),
    [liveQuery.data, transfers]
  );

  return {
    rate: resolved?.rate ?? null,
    rateDate: resolved?.rateDate ?? null,
    source: resolved?.source ?? 'none',
    isLoading: liveQuery.isLoading,
  };
}
