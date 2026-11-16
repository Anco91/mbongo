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
import { useTransfers } from '@/hooks/use-transfers';

/** 12 h session cache: no re-fetch within the same session. */
const STALE_TIME_12H = 12 * 60 * 60 * 1000;

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

  const liveQuery = useQuery({
    queryKey: ['exchange-rate'],
    queryFn: async (): Promise<{ rate: number; rateDate: string }> => {
      const res = await fetch(
        'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=CHF'
      );
      if (!res.ok) {
        throw new Error(`Frankfurter ${res.status}`);
      }
      const json = (await res.json()) as {
        date: string;
        rates: { CHF?: number };
      };
      const eurToChf = json.rates?.CHF;
      if (!eurToChf || eurToChf <= 0) {
        throw new Error('Invalid Frankfurter rate');
      }
      // counterValue convention: the rate converts CHF → EUR.
      return { rate: 1 / eurToChf, rateDate: json.date };
    },
    staleTime: STALE_TIME_12H,
    retry: 1,
  });

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
