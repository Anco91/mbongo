/**
 * Type Badge — charge type label with the maquette's color map.
 *
 * @module Components/Ui/TypeBadge
 */

import { cn } from '@/lib/utils';
import type { ChargeType } from '@mbongo/shared';
import { JSX } from 'react';

const labels: Record<ChargeType, string> = {
  FIXED_RECURRING: 'Fixe récurrente',
  INSTALLMENT: 'Échelonnée',
  TEMPORARY: 'Temporaire',
  ONE_OFF: 'Ponctuelle',
  UPCOMING: 'À venir (engagée)',
};

const styles: Record<ChargeType, string> = {
  FIXED_RECURRING: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  INSTALLMENT: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  TEMPORARY: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  ONE_OFF: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
  UPCOMING: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
};

export function TypeBadge({
  type,
  className,
}: {
  type: ChargeType;
  className?: string;
}): JSX.Element {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[11px] font-medium',
        styles[type],
        className
      )}
    >
      {labels[type]}
    </span>
  );
}
