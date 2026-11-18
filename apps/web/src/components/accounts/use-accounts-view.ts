/**
 * useAccountsView — member filter, loading/error state and the ready account
 * card view models (design D5).
 *
 * @module Components/Accounts/UseAccountsView
 */

'use client';

import { useMemo, useState } from 'react';
import type { Member } from '@mbongo/shared';
import { useAccounts } from '@/hooks/use-accounts';
import { useTransactions } from '@/hooks/use-transactions';
import { useMembers } from '@/hooks/use-members';
import { buildAccountCards, type AccountCardView } from '@/lib/accounts';

export interface AccountsView {
  cards: AccountCardView[];
  members: Member[];
  selectedMember: string;
  setSelectedMember: (memberId: string) => void;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAccountsView(): AccountsView {
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const { data: accounts = [], isLoading, error, refetch } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: members = [] } = useMembers();

  // Closed accounts disappear from the current view (history preserved).
  const activeAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.status === 'ACTIVE' &&
          (selectedMember === 'all' || account.memberId === selectedMember)
      ),
    [accounts, selectedMember]
  );

  const cards = useMemo(
    () => buildAccountCards(activeAccounts, transactions),
    [activeAccounts, transactions]
  );

  return {
    cards,
    members,
    selectedMember,
    setSelectedMember,
    isLoading,
    error,
    refetch: () => {
      void refetch();
    },
  };
}
