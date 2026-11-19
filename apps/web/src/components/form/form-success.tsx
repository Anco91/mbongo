/**
 * Form Success — the confirmation shown before returning to a list.
 *
 * @module Components/Form/FormSuccess
 */

import { JSX, type ReactNode } from 'react';

export function FormSuccess({
  message,
  children,
}: {
  message: string;
  children?: ReactNode;
}): JSX.Element {
  return (
    <div className="space-y-4">
      <div
        role="status"
        className="rounded-lg border border-emerald-300 bg-emerald-50 p-4"
      >
        <p className="text-emerald-700">{message}</p>
      </div>
      {children}
    </div>
  );
}
