/**
 * Select Input — kit primitive. Styles live here only.
 *
 * @module Components/Form/SelectInput
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/form/form';
import { JSX } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectInputProps {
  name: string;
  label: string;
  options: readonly SelectOption[];
  hint?: React.ReactNode;
  placeholder?: string;
}

export function SelectInput({
  name,
  label,
  options,
  hint,
  placeholder,
}: SelectInputProps): JSX.Element {
  const form = useFormContext();

  return (
    <FormField name={name} label={label} hint={hint}>
      <select
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
        {...form.register(name)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
