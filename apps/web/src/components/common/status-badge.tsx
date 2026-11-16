/**
 * Status Badge — status of a payment, charge or transfer.
 * Class map follows the validated maquette (mock_POC.tsx.todo).
 *
 * @module Components/Common/StatusBadge
 */

import { cn } from '@/lib/utils';
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
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-medium',
        styles[status] ?? 'bg-slate-100 text-slate-700',
        className
      )}
    >
      {status}
    </span>
  );
}
