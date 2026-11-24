/**
 * ShowClosedToggle — labelled checkbox that includes closed accounts in a
 * view (dashboard charts, accounts list). Controlled, no persistence.
 *
 * @module Components/Patterns/ShowClosedToggle
 */

import { JSX, useId } from 'react';

interface ShowClosedToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function ShowClosedToggle({
  checked,
  onChange,
}: ShowClosedToggleProps): JSX.Element {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 accent-slate-900"
      />
      <label htmlFor={id} className="text-xs text-slate-600">
        Afficher les comptes clôturés
      </label>
    </div>
  );
}
