/**
 * Month Queries
 *
 * Shared builders for the windowed month queries (design D5): the
 * server guards and the client hooks build THE SAME typed query and
 * THE SAME TanStack key, so prefetched data is reused instead of being
 * overwritten at refetch. Bounds are derived from the 'YYYY-MM' /
 * 'YYYY-MM-DD' string only — never from a `new Date()` captured in the
 * key — so the key stays stable within a day.
 *
 * @module Lib/MonthQueries
 */

import { addDays, endOfDay, parseISO } from 'date-fns';
import { monthBounds } from '@/lib/month-navigation';
import type { PaymentQuery, TransactionQuery } from '@mbongo/shared';

/** Upper bound of the windowed payment/alert queries. */
export const PAYMENTS_WINDOW_LIMIT = 500;

/** Single-page query of the unmatched-income screen (API cap is 500). */
export const UNMATCHED_QUERY: TransactionQuery = { limit: 500 };

/**
 * Windowed payments query for a month ('YYYY-MM'): every due date of
 * the chosen month, regardless of status (realized and planned).
 */
export function monthPaymentsQuery(monthKey: string): PaymentQuery {
  const { start, end } = monthBounds(monthKey);
  return {
    dueDate: { gte: start.toISOString(), lte: end.toISOString() },
    limit: PAYMENTS_WINDOW_LIMIT,
  };
}

/**
 * Windowed transactions query for a month ('YYYY-MM').
 */
export function monthTransactionsQuery(monthKey: string): TransactionQuery {
  const { start, end } = monthBounds(monthKey);
  return {
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
  };
}

/**
 * Windowed payments query for the alerts (day key 'YYYY-MM-DD'): every
 * PENDING due date up to D+30 inclusive — overdue history (no lower
 * bound) plus the 30-day forecast window of computeAlerts.
 */
export function alertsPaymentsQuery(dayKey: string): PaymentQuery {
  const horizon = endOfDay(addDays(parseISO(dayKey), 30));
  return {
    status: { eq: 'PENDING' },
    dueDate: { lte: horizon.toISOString() },
    limit: PAYMENTS_WINDOW_LIMIT,
  };
}
