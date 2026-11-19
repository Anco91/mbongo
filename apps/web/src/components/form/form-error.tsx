/**
 * Form Error — one failure message, always below the form actions.
 *
 * @module Components/Form/FormError
 */

import { JSX } from 'react';

export function FormError({ message }: { message: string }): JSX.Element {
  return (
    <p role="alert" className="text-sm text-red-600">
      {message}
    </p>
  );
}
