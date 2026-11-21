/**
 * Charge Schedule List — installment plan of one charge (design D5).
 * Read-only: each line shows its date, amount and status.
 *
 * @module Components/Charges/ChargeScheduleList
 */

import { JSX } from 'react';
import type { Payment } from '@mbongo/shared';
import { StatusBadge } from '@/components/ui';
import { formatAmount, formatDate } from '@/lib/format';

interface ChargeScheduleListProps {
  payments: Payment[];
}

export function ChargeScheduleList({
  payments,
}: ChargeScheduleListProps): JSX.Element {
  return (
    <>
      <p className="text-xs font-semibold text-slate-700">
        Échéances ({payments.length} échéances)
      </p>
      <div className="space-y-1.5 pt-1">
        {payments.map((payment, index) => (
          <div
            key={payment.id}
            className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs"
          >
            <span className="text-slate-500">
              #{index + 1} · {formatDate(payment.dueDate)}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800">
                {formatAmount(payment.amount, payment.currency)}
              </span>
              <StatusBadge
                status={payment.status === 'PAID' ? 'Payé' : 'À venir'}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
