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
  memberRoleSchema,
  type CreateMemberInput,
  type UpdateMemberInput,
  type Member,
} from '@mbongo/shared';
import { useCreateMember, useUpdateMember } from '@/hooks/use-members';
import { Form, FormSection, TextInput, SelectInput } from '@/components/form';
import { Button } from '@/components/ui/button';
import { JSX } from 'react';

const ROLE_OPTIONS = [
  { value: 'PRIMARY', label: 'Titulaire' },
  { value: 'PARTNER', label: 'Partenaire' },
] as const;

// Formulaire : lastName vide autorisé (''), mappé en null à la soumission.
const memberFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().nullish(),
  role: memberRoleSchema,
});

type MemberFormValues = z.infer<typeof memberFormSchema>;

export function MemberForm({
  member,
  onDone,
}: {
  /** Absent → mode création. */
  member?: Member;
  onDone?: () => void;
}): JSX.Element {
  const isEdit = Boolean(member);
  const { mutate: createMember, isPending: isCreating } = useCreateMember();
  const { mutate: updateMember, isPending: isUpdating } = useUpdateMember();

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName: member?.firstName ?? '',
      lastName: member?.lastName ?? '',
      role: member?.role ?? 'PRIMARY',
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    const lastName = data.lastName?.trim() ? data.lastName : null;
    if (member) {
      const input: UpdateMemberInput = {
        firstName: data.firstName,
        lastName,
        role: data.role,
      };
      updateMember({ id: member.id, input }, { onSuccess: () => onDone?.() });
    } else {
      const input: CreateMemberInput = {
        firstName: data.firstName,
        lastName,
        role: data.role,
      };
      createMember(input, { onSuccess: () => onDone?.() });
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
        <SelectInput name="role" label="Rôle" options={ROLE_OPTIONS} />
      </FormSection>
      <Button
        type="submit"
        className="w-full"
        disabled={isCreating || isUpdating}
      >
        {isEdit ? 'Enregistrer' : 'Créer le membre'}
      </Button>
      {(isCreating || isUpdating) && (
        <p className="text-xs text-slate-400">Enregistrement…</p>
      )}
    </Form>
  );
}
