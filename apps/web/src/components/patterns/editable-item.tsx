/**
 * Editable Item — Autonomous editable line with local draft state.
 *
 * Each item owns its draft state (no shared Record). The confirm button
 * is disabled when the amount is invalid or a mutation is pending.
 *
 * @module Components/Patterns/EditableItem
 */

'use client';

import { JSX, ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface EditableItemProps {
  label: string;
  meta?: ReactNode;
  amount: number;
  currency: string;
  actionLabel?: string;
  onConfirm: (amount: number) => unknown;
  isPending?: boolean;
  actions?: ReactNode;
}

/**
 * Parse a raw string into a number, returning null for invalid input.
 * Handles empty strings, whitespace, and non-numeric values.
 *
 * @example
 * parseAmount('123.45') // 123.45
 * parseAmount('') // null
 * parseAmount('abc') // null
 * parseAmount('  ') // null
 */
export function parseAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

/**
 * Editable item with inline amount input.
 *
 * - Local draft state (no shared Record)
 * - Button disabled if parseAmount === null || isPending
 * - Shows current amount as placeholder when draft is empty
 */
export function EditableItem({
  label,
  meta,
  amount,
  currency,
  actionLabel = 'Confirmer',
  onConfirm,
  isPending = false,
  actions,
}: EditableItemProps): JSX.Element {
  const [draft, setDraft] = useState<string>('');

  const parsedDraft = draft ? parseAmount(draft) : null;
  const effectiveAmount = parsedDraft ?? amount;
  const isDisabled = (draft !== '' && parsedDraft === null) || isPending;

  const handleConfirm = async (): Promise<void> => {
    await onConfirm(effectiveAmount);
    setDraft(''); // Reset draft after confirm
  };

  return (
    <>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {meta ? (
          <p className="text-sm text-slate-600">{meta}</p>
        ) : (
          <p className="text-sm text-slate-600">
            {amount.toFixed(2)} {currency}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={amount.toString()}
          className="w-32 px-3 py-1 border rounded text-sm"
          step="0.01"
          disabled={isPending}
        />
        <Button
          size="sm"
          onClick={() => void handleConfirm()}
          disabled={isDisabled}
          aria-busy={isPending}
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {actionLabel}
        </Button>
        {actions}
      </div>
    </>
  );
}
