/**
 * Delete Button — two-step destructive action, inline confirmation.
 *
 * @module Components/Patterns/DeleteButton
 */

'use client';

import { useState, JSX } from 'react';
import { IconTrash } from '@/components/ui/icons';

interface DeleteButtonProps {
  label: string;
  message: string;
  confirmLabel?: string;
  onDone?: () => void;
}

export function DeleteButton({
  label,
  message,
  confirmLabel = 'Supprimer',
  onDone,
}: DeleteButtonProps): JSX.Element {
  const [confirming, setConfirming] = useState(false);

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
          onClick={() => setConfirming(false)}
          className="h-8 flex-1 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onDone?.();
          }}
          className="h-8 flex-1 rounded-lg bg-red-600 text-xs font-medium text-white transition-colors hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
