/**
 * MemberScopeChips — « Foyer / <membre> » selector scoping the dashboard
 * charts. One chip per household member; `null` = whole household. When a
 * member is selected and `accounts` is given, a second row narrows to one of
 * their accounts.
 *
 * @module Components/Dashboard/MemberScopeChips
 */

'use client';

import { JSX } from 'react';
import type { Account, Member } from '@mbongo/shared';
import { FilterChips } from '@/components/patterns';

const HOUSEHOLD = '';
const ALL_ACCOUNTS = '';

interface MemberScopeChipsProps {
  members: readonly Member[];
  value: string | null;
  onChange: (memberId: string | null) => void;
  /** Accounts of the selected member (sub-scope row). */
  accounts?: ReadonlyArray<Pick<Account, 'id' | 'name' | 'accountType'>>;
  accountId?: string | null;
  onAccountChange?: (accountId: string | null) => void;
}

export function MemberScopeChips({
  members,
  value,
  onChange,
  accounts = [],
  accountId = null,
  onAccountChange,
}: MemberScopeChipsProps): JSX.Element {
  const items = [
    { value: HOUSEHOLD, label: 'Foyer' },
    ...members.map((m) => ({ value: m.id, label: m.firstName })),
  ];
  // Savings accounts are not offered as a chart sub-scope.
  const scopableAccounts = accounts.filter((a) => a.accountType !== 'SAVINGS');
  const accountItems = [
    { value: ALL_ACCOUNTS, label: 'Tous les comptes' },
    ...scopableAccounts.map((a) => ({ value: a.id, label: a.name })),
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterChips
        items={items}
        value={value ?? HOUSEHOLD}
        onChange={(v) => onChange(v === HOUSEHOLD ? null : v)}
      />
      {value !== null && onAccountChange && scopableAccounts.length > 0 && (
        <FilterChips
          items={accountItems}
          value={accountId ?? ALL_ACCOUNTS}
          onChange={(v) => onAccountChange(v === ALL_ACCOUNTS ? null : v)}
        />
      )}
      {value !== null && (
        <p className="text-xs text-slate-500">
          Charges communes visibles sous Foyer
        </p>
      )}
    </div>
  );
}
