/**
 * Progress primitive — shadcn-compatible.
 *
 * @module Components/UI/Progress
 */

import * as React from 'react';
import { JSX } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress percentage, 0–100. */
  value?: number;
}

function Progress({
  className,
  value = 0,
  ...props
}: ProgressProps): JSX.Element {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-slate-100',
        className
      )}
      {...props}
    >
      <div
        className="h-full rounded-full bg-emerald-500 transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
