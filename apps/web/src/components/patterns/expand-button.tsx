/**
 * Expand Button — "Plein écran" header button of chart cards.
 *
 * @module Components/Patterns/ExpandButton
 */

import { IconArrowsExpand } from '@/components/ui/icons';
import { JSX } from 'react';

export function ExpandButton({
  onClick,
}: {
  onClick: () => void;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
    >
      <IconArrowsExpand className="h-3.5 w-3.5" /> Plein écran
    </button>
  );
}
