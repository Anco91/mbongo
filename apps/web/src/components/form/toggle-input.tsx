/**
 * Toggle Input — segmented two-option control (maquette `SegmentedToggle`).
 * Works for booleans (Oui/Non) and enums (EUR/CHF) via setValue.
 *
 * @module Components/Form/ToggleInput
 */

'use client';

import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/form/form';
import { JSX } from 'react';

export interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleInputProps {
  name: string;
  label: string;
  options: readonly ToggleOption[];
  /** When `true`, the field value is a boolean (zod) and options use 'true'/'false'. */
  booleanValue?: boolean;
  /** Controlled mode: current value shown (ignores `name` lookup). */
  currentValue?: string;
  /** Controlled mode: change handler (ignores `name` update). */
  onChange?: (value: string) => void;
}

export function ToggleInput({
  name,
  label,
  options,
  booleanValue = false,
  currentValue,
  onChange,
}: ToggleInputProps): JSX.Element {
  const form = useFormContext();
  const raw: unknown = currentValue ?? form.watch(name);
  // Controlled mode already carries the option string ('true'/'false').
  const value =
    booleanValue && currentValue === undefined
      ? String(Boolean(raw))
      : String(raw ?? '');
  const select = (optionValue: string): void => {
    if (onChange) {
      onChange(optionValue);
      return;
    }
    const next = booleanValue ? optionValue === 'true' : optionValue;
    void form.setValue(name, next as never, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <FormField name={name} label={label}>
      <div className="flex rounded-lg bg-slate-100 p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => select(option.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              value === option.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </FormField>
  );
}

/** Helpers to build toggle options from booleans / currencies. */
export const yesNoOptions = [
  { value: 'true', label: 'Oui' },
  { value: 'false', label: 'Non' },
] as const;

export const currencyOptions = [
  { value: 'EUR', label: 'EUR' },
  { value: 'CHF', label: 'CHF' },
] as const;
