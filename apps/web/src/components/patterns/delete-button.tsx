/**
 * Delete Button — two-step destructive action, inline confirmation.
 *
 * `onConfirmed` returns a promise: the control stays disabled until the
 * mutation settles, so a caller can await it before navigating. A rejected
 * promise keeps the user in place and shows the failure.
 *
 * @module Components/Patterns/DeleteButton
 */

'use client';

import { useState, JSX } from 'react';
import { Loader2 } from 'lucide-react';
import { IconTrash } from '@/components/ui/icons';

interface DeleteButtonProps {
  label: string;
  message: string;
  confirmLabel?: string;
  /** Runs the deletion. The button waits for it before unlocking. */
  onConfirmed: () => Promise<unknown>;
}

export function DeleteButton({
  label,
  message,
  confirmLabel = 'Supprimer',
  onConfirmed,
}: DeleteButtonProps): JSX.Element {
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(): Promise<void> {
    setIsPending(true);
    setError(null);
    try {
      await onConfirmed();
      setConfirming(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Action impossible. Réessayez.'
      );
    } finally {
      setIsPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        <IconTrash className="h-3.5 w-3.5" /> {label}
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="text-xs leading-relaxed text-red-700">{message}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={isPending}
          className="h-8 flex-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={isPending}
          aria-busy={isPending}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
