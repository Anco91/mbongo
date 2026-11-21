/**
 * Household Content — member list with
 * rename and two-step delete. Create/edit reuse
 * `MemberForm`. No hardcoded « Anco / épouse »: the seed members are
 * listed like any other, fully editable.
 *
 * @module Components/Household/HouseholdContent
 */

'use client';

import { useState, JSX } from 'react';
import { useMembers, useDeleteMember } from '@/hooks/use-members';
import { MemberForm } from './member-form';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteButton } from '@/components/patterns';
import { IconPlus } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

export function HouseholdContent(): JSX.Element {
  const { data: members = [] } = useMembers();
  const { mutateAsync: deleteMember } = useDeleteMember();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {creating && (
        <Card>
          <CardContent className="pt-4">
            <MemberForm
              onDone={() => setCreating(false)}
              onCancel={() => setCreating(false)}
            />
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
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
              {editingId !== member.id && (
                <div className="mt-2">
                  <DeleteButton
                    label="Supprimer le membre"
                    message={`Supprimer « ${member.firstName} » ? Ses comptes restent intacts et deviennent « Foyer ».`}
                    onConfirmed={() => deleteMember(member.id)}
                  />
                </div>
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
