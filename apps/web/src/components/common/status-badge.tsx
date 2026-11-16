/**
 * Status Badge — status of a payment, charge or transfer.
 * Class map follows the validated maquette (mock_POC.tsx.todo).
 * Raw codes (`DUE`, `COMPLETED`…) and French labels (`Dû`, `Réalisé`…)
 * are both accepted; FR labels come from the shared source of truth
 * (`PAYMENT_STATUS_LABELS`), so the UI never shows a raw code.
 *
 * @module Components/Common/StatusBadge
 */

import { cn } from '@/lib/utils';
import { paymentStatusLabel } from '@mbongo/shared';
import { JSX } from 'react';

const styles: Record<string, string> = {
  Dû: 'bg-amber-100 text-amber-800',
  'À venir': 'bg-slate-100 text-slate-700',
  Payé: 'bg-emerald-100 text-emerald-700',
  Provisionnée: 'bg-orange-100 text-orange-700',
  Réalisé: 'bg-emerald-100 text-emerald-700',
  Estimé: 'bg-amber-100 text-amber-800',
  Dépassé: 'bg-red-100 text-red-700',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}): JSX.Element {
  const label = paymentStatusLabel(status);
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-medium',
        styles[label] ?? 'bg-slate-100 text-slate-700',
        className
      )}
    >
      {label}
    </span>
  );
}
