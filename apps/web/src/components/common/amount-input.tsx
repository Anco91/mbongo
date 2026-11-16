/**
 * Amount Input — monetary amount (decimal). Currency is a separate field
 * (`currencyOptions` toggle), matching the shared zod schemas.
 *
 * @module Components/Common/AmountInput
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/common/form';
import { JSX } from 'react';

interface AmountInputProps {
  name: string;
  label: string;
  hint?: React.ReactNode;
}

export function AmountInput({
  name,
  label,
  hint,
}: AmountInputProps): JSX.Element {
  const form = useFormContext();

  return (
    <FormField name={name} label={label} hint={hint}>
      <input
        type="number"
        step="0.01"
        placeholder="0.00"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
        {...form.register(name, { valueAsNumber: true })}
      />
    </FormField>
  );
}
