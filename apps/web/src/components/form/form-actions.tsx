/**
 * Form Actions — the single action layout of every form: primary action,
 * optional cancel, then the destructive zone behind a rule.
 *
 * The primary label stays unchanged while pending; only a spinner and the
 * disabled state change, so the button never resizes.
 *
 * @module Components/Form/FormActions
 */

'use client';

import { JSX, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FormError } from '@/components/form/form-error';

interface FormActionsProps {
  /** Label of the primary action, kept stable while pending. */
  submitLabel: string;
  /** True while the mutation runs. */
  isPending?: boolean;
  /** Optional cancel action, rendered below the primary action. */
  onCancel?: () => void;
  cancelLabel?: string;
  /** Optional destructive zone, rendered after a separator. */
  destructive?: ReactNode;
  /** Mutation failure, rendered below the actions. */
  error?: string | null;
  /** Disables the primary action without showing a spinner. */
  disabled?: boolean;
}

export function FormActions({
  submitLabel,
  isPending = false,
  onCancel,
  cancelLabel = 'Annuler',
  destructive,
  error,
  disabled = false,
}: FormActionsProps): JSX.Element {
  return (
    <div className="space-y-3">
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isPending || disabled}
        aria-busy={isPending}
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>

      {onCancel && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={onCancel}
          disabled={isPending}
        >
          {cancelLabel}
        </Button>
      )}

      {error && <FormError message={error} />}

      {destructive && (
        <div className="space-y-3 pt-2">
          <Separator />
          {destructive}
        </div>
      )}
    </div>
  );
}
