/**
 * Schedule Row — one line of the 60-day schedule: label, amount, status,
 * account chip and due date. A persisted row links to its detail page; a
 * virtual card entry (encours) is not reconcilable and has no link.
 *
 * @module Components/Schedule/ScheduleRow
 */

import { JSX } from 'react';
import Link from 'next/link';
import { AccountChip, StatusBadge } from '@/components/ui';
import { formatAmount, formatDate } from '@/lib/format';
import type { ScheduleRow as ScheduleRowModel } from '@/components/schedule/use-schedule-rows';

interface ScheduleRowProps {
  row: ScheduleRowModel;
}

export function ScheduleRow({ row }: ScheduleRowProps): JSX.Element {
  const body = (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-medium text-slate-800">
          {row.label}
        </p>
        <p className="shrink-0 text-sm font-semibold text-slate-900">
          {formatAmount(row.amount, row.currency)}
        </p>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <StatusBadge status={row.status === 'DUE' ? 'Dû' : 'À venir'} />
        <AccountChip name={row.accountLabel} />
        <span className="text-xs text-slate-400">
          {formatDate(row.dueDate.toISOString())}
        </span>
        {row.settlementLabel && (
          <span className="truncate text-xs text-slate-400">
            prélèvement sur {row.settlementLabel}
          </span>
        )}
      </div>
    </div>
  );

  // Une échéance virtuelle (encours carte) n'est pas rapprochable : pas de
  // lien, seule la carte la porte visuellement.
  if (!row.payment) {
    return <div className="bg-amber-50/40">{body}</div>;
  }
  return (
    <Link
      href={`/schedule/${row.payment.id}`}
      className="block transition-colors hover:bg-slate-50"
    >
      {body}
    </Link>
  );
}
