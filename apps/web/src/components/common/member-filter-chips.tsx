/**
 * Member Filter Chips — « Tous les membres » plus one chip per household
 * member. Shared by the accounts and charges lists (design D7).
 *
 * @module Components/Common/MemberFilterChips
 */

'use client';

import type { Member } from '@mbongo/shared';
import {
  FilterChips,
  type FilterChipItem,
} from '@/components/common/filter-chips';
import { JSX, useMemo } from 'react';

interface MemberFilterChipsProps {
  members: Member[];
  value: string;
  onChange: (memberId: string) => void;
}

export function MemberFilterChips({
  members,
  value,
  onChange,
}: MemberFilterChipsProps): JSX.Element | null {
  const items = useMemo<FilterChipItem[]>(
    () => [
      { value: 'all', label: 'Tous les membres' },
      ...members.map((member) => ({
        value: member.id,
        label: member.firstName,
      })),
    ],
    [members]
  );

  if (members.length === 0) return null;

  return <FilterChips items={items} value={value} onChange={onChange} />;
}
