/**
 * Detail Row — label/value row used inside detail sheets.
 *
 * @module Components/Patterns/DetailRow
 */

import { JSX } from 'react';

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
