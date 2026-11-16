/**
 * Text Input — kit primitive. Styles live here only.
 *
 * @module Components/Common/TextInput
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/common/form';
import { JSX } from 'react';

interface TextInputProps {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  hint?: React.ReactNode;
}

export function TextInput({
  name,
  label,
  placeholder,
  type = 'text',
  hint,
}: TextInputProps): JSX.Element {
  const form = useFormContext();

  return (
    <FormField name={name} label={label} hint={hint}>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
        {...form.register(name)}
      />
    </FormField>
  );
}
