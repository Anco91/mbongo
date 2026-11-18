/**
 * useChargesView — filter state and derived indexes for the charges list
 * (design D5). No derivation in the render: the view consumes ready maps.
 *
 * @module Components/Charges/UseChargesView
 */

'use client';

import { useMemo, useState } from 'react';
import type { Account, Charge, Member, Payment } from '@mbongo/shared';
import { useCharges, useDeleteCharge } from '@/hooks/use-charges';
import { usePayments } from '@/hooks/use-schedule';
import { useAccounts } from '@/hooks/use-accounts';
import { useMembers } from '@/hooks/use-members';
import {
  buildAccountsMap,
  filterCharges,
  groupPaymentsByCharge,
  nextPendingByCharge,
} from '@/lib/filters';
import type { ChargeFilter } from '@/lib/charges';

export interface ChargesView {
  filter: ChargeFilter;
  setFilter: (filter: ChargeFilter) => void;
  selectedMember: string;
  setSelectedMember: (memberId: string) => void;
  members: Member[];
  visible: Charge[];
  accountsById: Map<string, Account>;
  paymentsByCharge: Map<string, Payment[]>;
  nextByCharge: Map<string, Payment>;
  deleteCharge: (id: string) => void;
  isDeleting: boolean;
}

export function useChargesView(): ChargesView {
  const [filter, setFilter] = useState<ChargeFilter>('Toutes');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const { data: charges = [] } = useCharges();
  const { data: payments = [] } = usePayments();
  const { data: accounts = [] } = useAccounts();
  const { data: members = [] } = useMembers();
  const { mutate: deleteCharge, isPending: isDeleting } = useDeleteCharge();

  const accountsById = useMemo(() => buildAccountsMap(accounts), [accounts]);
  const paymentsByCharge = useMemo(
    () => groupPaymentsByCharge(payments),
    [payments]
  );
  const nextByCharge = useMemo(() => nextPendingByCharge(payments), [payments]);
  const visible = useMemo(
    () => filterCharges(charges, accountsById, filter, selectedMember),
    [charges, accountsById, filter, selectedMember]
  );

  return {
    filter,
    setFilter,
    selectedMember,
    setSelectedMember,
    members,
    visible,
    accountsById,
    paymentsByCharge,
    nextByCharge,
    deleteCharge,
    isDeleting,
  };
}
