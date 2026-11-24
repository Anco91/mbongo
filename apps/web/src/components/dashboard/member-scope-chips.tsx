/**
 * MemberScopeChips — « Foyer / <membre> » selector scoping the dashboard
 * charts. One chip per household member; `null` = whole household.
 *
 * @module Components/Dashboard/MemberScopeChips
 */

'use client';

import { JSX } from 'react';
import type { Member } from '@mbongo/shared';
import { FilterChips } from '@/components/patterns';

const HOUSEHOLD = '';

interface MemberScopeChipsProps {
  members: readonly Member[];
  value: string | null;
  onChange: (memberId: string | null) => void;
}

export function MemberScopeChips({
  members,
  value,
  onChange,
}: MemberScopeChipsProps): JSX.Element {
  const items = [
    { value: HOUSEHOLD, label: 'Foyer' },
    ...members.map((m) => ({ value: m.id, label: m.firstName })),
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterChips
        items={items}
        value={value ?? HOUSEHOLD}
        onChange={(v) => onChange(v === HOUSEHOLD ? null : v)}
      />
      {value !== null && (
        <p className="text-xs text-slate-500">
          Hors comptes joints (visibles sous Foyer)
        </p>
      )}
    </div>
  );
}
