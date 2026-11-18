/**
 * Owner Badge — « qui paie » chip on charge / payment / account /
 * provision cards (M4, design D2).
 *
 * Dérivation pure `ownerLabel` (testable sans React) + composant qui lit
 * la liste des membres via `useMembers` — une seule source d'affichage
 * pour toutes les vues.
 *
 * @module Components/Common/OwnerBadge
 */

import { JSX } from 'react';
import type { Member } from '@mbongo/shared';
import { useMembers } from '@/hooks/use-members';

/**
 * Label d'attribution : prénom du membre propriétaire du compte débité,
 * « Foyer » quand le compte n'est attribué à personne ou que le membre
 * n'existe plus (supprimé).
 */
export function ownerLabel(
  memberId: string | null | undefined,
  members: Array<Pick<Member, 'id' | 'firstName'>>
): string {
  if (!memberId) return 'Foyer';
  const member = members.find((m) => m.id === memberId);
  return member ? member.firstName : 'Foyer';
}

export function OwnerBadge({
  memberId,
}: {
  memberId: string | null | undefined;
}): JSX.Element {
  const { data: members = [] } = useMembers();
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-indigo-200">
      {ownerLabel(memberId, members)}
    </span>
  );
}
