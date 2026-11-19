/**
 * Form Kit — compound form components on React Hook Form.
 *
 * Styles live here only: forms never style themselves locally. Validation
 * is the shared zod schema via `zodResolver` (R7). The parent owns the
 * `useForm` instance (resolver + defaults) and passes it to `<Form>`.
 *
 * @example
 * ```tsx
 * const form = useForm<CreateChargeInput>({ resolver: zodResolver(createChargeSchema), ... });
 * <Form form={form} onSubmit={form.handleSubmit(createCharge)}>
 *   <TextInput name="label" label="Intitulé" placeholder="Ex. Loyer GE…" />
 *   <SelectInput name="type" label="Type de charge" options={CHARGE_TYPES} />
 *   <FormSection title="Récurrence">…</FormSection>
 *   <Button type="submit" className="w-full">Créer la charge</Button>
 * </Form>
 * ```
 *
 * @module Components/Form/Form
 */

'use client';

import {
  FormProvider,
  useFormContext,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { JSX } from 'react';

interface FormProps<TFieldValues extends FieldValues> {
  /** The useForm instance owned by the parent. */
  form: UseFormReturn<TFieldValues>;
  /** `form.handleSubmit(...)` — the parent wires validation itself. */
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
}

export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: FormProps<TFieldValues>): JSX.Element {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(event);
        }}
        noValidate
        className={className ?? 'space-y-4'}
      >
        {children}
      </form>
    </FormProvider>
  );
}

/** Section heading inside a form, per the maquette. */
export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
        {title}
      </p>
      {children}
    </section>
  );
}

/** Label + control + error/hint. Reads the error from the form context by name. */
export function FormField({
  name,
  label,
  hint,
  error,
  children,
}: {
  name?: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}): JSX.Element {
  const form = useFormContext();
  const fieldError = name ? form.formState.errors[name]?.message : undefined;
  const message =
    error ?? (typeof fieldError === 'string' ? fieldError : undefined);

  return (
    <div className="space-y-1.5">
      <label className="block space-y-1.5">
        <span className="block text-xs font-medium text-slate-600">
          {label}
        </span>
        {children}
      </label>
      {hint && !message && (
        <p className="-mt-1 text-[11px] text-slate-400">{hint}</p>
      )}
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}

/** Gray info box — form explanations, per the maquette. */
export function FormHint({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <p className="rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-500">
      {children}
    </p>
  );
}
