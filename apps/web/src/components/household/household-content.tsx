/**
 * Household Content — vue foyer (M4, design D1): member list with
 * rename, role change and two-step delete. Create/edit reuse
 * `MemberForm`. No hardcoded « Anco / épouse »: the seed members are
 * listed like any other, fully editable.
 *
 * @module Components/Household/HouseholdContent
 */

'use client';

import { useState, JSX } from 'react';
import type { Member } from '@mbongo/shared';
import { useMembers, useDeleteMember } from '@/hooks/use-members';
import { MemberForm } from './member-form';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteButton } from '@/components/common';
import { IconPlus } from '@/components/common/icons';
import { Button } from '@/components/ui/button';

const ROLE_LABELS: Record<Member['role'], string> = {
  PRIMARY: 'Titulaire',
  PARTNER: 'Partenaire',
};

export function HouseholdContent(): JSX.Element {
  const { data: members = [] } = useMembers();
  const { mutate: deleteMember, isPending: isDeleting } = useDeleteMember();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {creating && (
        <Card>
          <CardContent className="pt-4">
            <MemberForm onDone={() => setCreating(false)} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setCreating(false)}
            >
              Annuler
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="divide-y divide-slate-100 pt-2">
          {members.length === 0 && !creating && (
            <p className="py-6 text-center text-sm text-slate-400">
              Aucun membre du foyer.
            </p>
          )}
          {members.map((member) => (
            <div key={member.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {member.firstName}
                    {member.lastName ? ` ${member.lastName}` : ''}
                  </p>
                  <p className="text-xs text-slate-400">
                    {ROLE_LABELS[member.role]}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreating(false);
                    setEditingId(editingId === member.id ? null : member.id);
                  }}
                >
                  {editingId === member.id ? 'Fermer' : 'Modifier'}
                </Button>
              </div>
              {editingId === member.id && (
                <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <MemberForm
                    member={member}
                    onDone={() => setEditingId(null)}
                  />
                </div>
              )}
              {editingId !== member.id && (
                <div className="mt-2">
                  <DeleteButton
                    label="Supprimer le membre"
                    message={`Supprimer « ${member.firstName} » ? Ses comptes restent intacts et deviennent « Foyer ».`}
                    onDone={() => deleteMember(member.id)}
                  />
                </div>
              )}
              {isDeleting && editingId !== member.id && (
                <p className="mt-1 text-xs text-slate-400">Suppression…</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {!creating && (
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={() => {
            setEditingId(null);
            setCreating(true);
          }}
        >
          <IconPlus className="h-4 w-4" /> Nouveau membre
        </Button>
      )}
    </div>
  );
}
