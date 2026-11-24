/**
 * Exchange Rate Queries
 *
 * Query factory for the live EUR/CHF rate (Frankfurter, ECB rate, no key):
 * the only source of its query key and `queryOptions`.
 *
 * @module Queries/ExchangeRate
 */

import { queryOptions } from '@tanstack/react-query';

const KEY = 'exchange-rate' as const;

/** 12 h session cache: no re-fetch within the same session. */
const STALE_TIME_12H = 12 * 60 * 60 * 1000;

export const exchangeRateQueries = {
  all: () => [KEY] as const,
  latest: () =>
    queryOptions({
      queryKey: [KEY] as const,
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
    }),
};
