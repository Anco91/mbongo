/**
 * Async state primitives — one loading look and one error panel for every
 * view (design D7). Labels are French, retry is explicit.
 *
 * @module Components/Common/AsyncState
 */

import { JSX } from 'react';
import { Button } from '@/components/ui/button';

interface LoadingStateProps {
  label?: string;
}

/** Centred loading indicator shared by all list views. */
export function LoadingState({
  label = 'Chargement…',
}: LoadingStateProps): JSX.Element {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <span className="text-sm text-slate-500" role="status">
        {label}
      </span>
    </div>
  );
}

interface ErrorPanelProps {
  title: string;
  message?: string;
  onRetry?: () => void;
}

/** Error panel with an explicit retry action. */
export function ErrorPanel({
  title,
  message,
  onRetry,
}: ErrorPanelProps): JSX.Element {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-4">
      <h3 className="mb-2 font-semibold text-red-700">{title}</h3>
      {message && <p className="mb-3 text-sm text-red-600">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
