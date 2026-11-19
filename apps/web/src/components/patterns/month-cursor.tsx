/**
 * Month Cursor — « ‹ nov. 2026 › » card (M4, design D3) — primitive
 * réutilisable hors dashboard.
 * Pure presentation: the parent owns the selected-month state.
 *
 * @module Components/Patterns/MonthCursor
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { IconChevronLeft, IconChevronRight } from '@/components/ui/icons';
import { monthLabel, shiftMonthKey } from '@/lib/month-navigation';
import { JSX } from 'react';

interface MonthCursorProps {
  selectedMonth: string;
  onChange: (next: string) => void;
}

export function MonthCursor({
  selectedMonth,
  onChange,
}: MonthCursorProps): JSX.Element {
  const navButton =
    'flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100';
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-2">
        <button
          type="button"
          onClick={() => onChange(shiftMonthKey(selectedMonth, -1))}
          className={navButton}
          aria-label="Mois précédent"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium capitalize text-slate-800">
          {monthLabel(selectedMonth)}
        </span>
        <button
          type="button"
          onClick={() => onChange(shiftMonthKey(selectedMonth, 1))}
          className={navButton}
          aria-label="Mois suivant"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
