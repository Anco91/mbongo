/**
 * Inline Error — one-line error message for a failed mutation, announced
 * to assistive tech.
 *
 * @module Components/Common/InlineError
 */

import { JSX } from 'react';

export function InlineError({ message }: { message: string }): JSX.Element {
  return (
    <p className="text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}
