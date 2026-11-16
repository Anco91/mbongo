/**
 * Display Currency Provider
 *
 * Shared EUR/CHF display context (maquette header selector): the header
 * writes, every main view reads. Selection persists per device in
 * localStorage; native stored amounts never change — the selection only
 * reformats what is shown.
 *
 * Also exposes the current exchange rate meta (from `useExchangeRate`),
 * the single source of truth for both the currency display and the dated
 * consolidation mention.
 *
 * @module Components/Providers/DisplayCurrencyProvider
 */

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
} from 'react';
import { useExchangeRate } from '@/hooks/use-exchange-rate';

export type DisplayCurrency = 'EUR' | 'CHF';

const STORAGE_KEY = 'mbongo.displayCurrency';

interface DisplayCurrencyContextValue {
  displayCurrency: DisplayCurrency;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  /** CHF → EUR rate (counterValue convention), or null when unavailable. */
  rate: number | null;
  rateDate: string | null;
  rateSource: 'live' | 'fallback' | 'none';
  rateLoading: boolean;
  /** Converts a EUR-converted value into the display currency. */
  convert: (eurValue: number) => number;
}

const DisplayCurrencyContext =
  createContext<DisplayCurrencyContextValue | null>(null);

export function DisplayCurrencyProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [displayCurrency, setDisplayCurrencyState] =
    useState<DisplayCurrency>('EUR');
  const { rate, rateDate, source, isLoading } = useExchangeRate();

  // Read the persisted selection once mounted (SSR-safe: default EUR until then).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'EUR' || stored === 'CHF') {
        setDisplayCurrencyState(stored);
      }
    } catch {
      // localStorage unavailable (private mode): default EUR.
    }
  }, []);

  const setDisplayCurrency = useCallback((currency: DisplayCurrency): void => {
    setDisplayCurrencyState(currency);
    try {
      window.localStorage.setItem(STORAGE_KEY, currency);
    } catch {
      // Ignore persistence failure: the choice stays valid for the session.
    }
  }, []);

  const convert = useCallback(
    (eurValue: number): number => {
      if (displayCurrency === 'EUR') return eurValue;
      if (!rate || rate <= 0) return eurValue;
      // EUR → CHF is the inverse of the CHF → EUR rate.
      return Math.round((eurValue / rate) * 100) / 100;
    },
    [displayCurrency, rate]
  );

  const value = useMemo(
    () => ({
      displayCurrency,
      setDisplayCurrency,
      rate,
      rateDate,
      rateSource: source,
      rateLoading: isLoading,
      convert,
    }),
    [
      displayCurrency,
      setDisplayCurrency,
      rate,
      rateDate,
      source,
      isLoading,
      convert,
    ]
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) {
    throw new Error(
      'useDisplayCurrency must be used within DisplayCurrencyProvider'
    );
  }
  return ctx;
}
