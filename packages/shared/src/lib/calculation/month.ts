/**
 * Month Range — pure month window from an ISO date or 'YYYY-MM' string
 * (M4, design D3). One source of truth for the dashboard monthly
 * cursor: every monthly view (Sankey, donut, échéances, provisions)
 * filters its inputs with the same { start, end } inclusive window.
 *
 * @module Shared/Lib/Calculation/Month
 */

import { parseISO, startOfMonth, endOfMonth } from 'date-fns';

export interface MonthRange {
  /** First day of the month, 00:00 local. */
  start: Date;
  /** Last day of the month, 23:59:59.999 local. */
  end: Date;
}

/**
 * Inclusive [start, end] window of the month containing `iso`
 * ('YYYY-MM' or any ISO date). Invalid input falls back to the
 * current month.
 */
export function monthRange(iso: string): MonthRange {
  const parsed = parseISO(iso);
  const base = isNaN(parsed.getTime()) ? new Date() : parsed;
  return {
    start: startOfMonth(base),
    end: endOfMonth(base),
  };
}

/**
 * True when an ISO datetime falls inside the month window (inclusive).
 */
export function isInMonth(isoDate: string, range: MonthRange): boolean {
  const parsed = parseISO(isoDate);
  return parsed >= range.start && parsed <= range.end;
}
