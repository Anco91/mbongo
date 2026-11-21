/**
 * Member Form — create/edit a household member on the form kit
 * (M4, design D1). One component, two modes: `member` absent → create.
 * Validation uses a form-local zod schema (empty name field allowed,
 * mapped to null at submit); the API edge stays the shared
 * `createMemberSchema` (R7).
 *
 * @module Components/Household/MemberForm
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  type CreateMemberInput,
  type UpdateMemberInput,
  type Member,
} from '@mbongo/shared';
import { useCreateMember, useUpdateMember } from '@/hooks/use-members';
import { Form, FormActions, FormSection, TextInput } from '@/components/form';
import { JSX } from 'react';

// Formulaire : lastName vide autorisé (''), mappé en null à la soumission.
const memberFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().nullish(),
});

type MemberFormValues = z.infer<typeof memberFormSchema>;

export function MemberForm({
  member,
  onDone,
  onCancel,
}: {
  /** Absent → mode création. */
  member?: Member;
  onDone?: () => void;
  onCancel?: () => void;
}): JSX.Element {
  const isEdit = Boolean(member);
  const create = useCreateMember();
  const update = useUpdateMember();
  const isPending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName: member?.firstName ?? '',
      lastName: member?.lastName ?? '',
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    const lastName = data.lastName?.trim() ? data.lastName : null;
    if (member) {
      const input: UpdateMemberInput = {
        firstName: data.firstName,
        lastName,
      };
      update.mutate({ id: member.id, input }, { onSuccess: () => onDone?.() });
    } else {
      const input: CreateMemberInput = {
        firstName: data.firstName,
        lastName,
      };
      create.mutate(input, { onSuccess: () => onDone?.() });
    }
  });

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormSection title="Identité">
        <TextInput name="firstName" label="Prénom" placeholder="Ex. Anco" />
        <TextInput
          name="lastName"
          label="Nom (optionnel)"
          placeholder="Ex. Dupont"
        />
      </FormSection>
      <FormActions
        submitLabel={isEdit ? 'Enregistrer' : 'Créer le membre'}
        isPending={isPending}
        error={error?.message}
        onCancel={onCancel}
      />
    </Form>
  );
}
