/**
 * Card primitive — shadcn-compatible, styles live here only.
 *
 * @module Components/UI/Card
 */

import * as React from 'react';
import { JSX } from 'react';
import { cn } from '@/lib/utils';

function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-4', className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return (
    <h3
      className={cn(
        'font-semibold leading-none tracking-tight text-slate-900',
        className
      )}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent };
