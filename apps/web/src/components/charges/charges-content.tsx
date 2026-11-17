/**
 * Charges Content Component
 *
 * Client presentation (maquette `ChargesScreen`): filter chips, tappable
 * charge rows opening a bottom-sheet detail with badges, details and the
 * two-step delete. Data comes from the hydration boundary (ChargesGuard);
 * mutations go through the domain hooks (R6).
 *
 * @module Components/Charges/ChargesContent
 */

'use client';

import { useMemo, useState, JSX } from 'react';
import Link from 'next/link';
import { remainingBalance, type Charge, type Payment } from '@mbongo/shared';
import { useCharges, useDeleteCharge } from '@/hooks/use-charges';
import { usePayments } from '@/hooks/use-schedule';
import { useAccounts } from '@/hooks/use-accounts';
import { useMembers } from '@/hooks/use-members';
import {
  StatusBadge,
  TypeBadge,
  AccountChip,
  DetailSheet,
  DetailRow,
  DeleteButton,
  OwnerBadge,
} from '@/components/common';
import { formatAmount, formatDate } from '@/components/common/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { IconPlus } from '@/components/common/icons';

const FILTERS = ['Toutes', 'Fixes', 'Échelonnées', 'À venir'] as const;
type Filter = (typeof FILTERS)[number];

/**
 * Derived display status (no stored status on a charge):
 * provisioned → « Provisionnée » ; next payment due → « Dû » ;
 * future payment → « À venir » ; else « Payé ».
 */
function chargeStatus(charge: Charge, nextPayment: Payment | null): string {
  if (charge.provisioned) return 'Provisionnée';
  if (!nextPayment) return 'Payé';
  return nextPayment.dueDate <= new Date().toISOString() ? 'Dû' : 'À venir';
}

export function ChargesContent(): JSX.Element {
  const [filter, setFilter] = useState<Filter>('Toutes');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const { data: charges = [] } = useCharges();
  const { data: payments = [] } = usePayments();
  const { data: accounts = [] } = useAccounts();
  const { data: members = [] } = useMembers();
  const { mutate: deleteCharge, isPending: isDeleting } = useDeleteCharge();

  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts]
  );

  // Group payments by charge
  const paymentsByCharge = useMemo(() => {
    const map = new Map<string, Payment[]>();
    for (const payment of payments) {
      const list = map.get(payment.chargeId) ?? [];
      list.push(payment);
      map.set(payment.chargeId, list);
    }
    // Sort each group by dueDate ascending
    for (const list of map.values()) {
      list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }
    return map;
  }, [payments]);

  // Next pending payment per charge (first by due date).
  const nextByCharge = useMemo(() => {
    const map = new Map<string, Payment>();
    for (const payment of payments) {
      if (payment.status !== 'PENDING') continue;
      const existing = map.get(payment.chargeId);
      if (!existing || payment.dueDate < existing.dueDate) {
        map.set(payment.chargeId, payment);
      }
    }
    return map;
  }, [payments]);

  const visible = charges.filter((charge) => {
    const account = accountsById.get(charge.accountId);
    if (selectedMember !== 'all' && account?.memberId !== selectedMember) {
      return false;
    }

    if (filter === 'Toutes') return true;
    if (filter === 'Fixes') return charge.type === 'FIXED_RECURRING';
    if (filter === 'Échelonnées') return charge.type === 'INSTALLMENT';
    return (
      charge.type === 'UPCOMING' ||
      charge.type === 'TEMPORARY' ||
      charge.provisioned
    );
  });

  return (
    <div className="space-y-3">
      {/* Filtre Membre du foyer */}
      {members.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setSelectedMember('all')}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedMember === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous les membres
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMember(m.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedMember === m.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m.firstName}
            </button>
          ))}
        </div>
      )}

      {/* Filtre Type de charge */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="divide-y divide-slate-100 pt-2">
          {visible.map((charge) => {
            const next = nextByCharge.get(charge.id) ?? null;
            const status = chargeStatus(charge, next);
            const account = accountsById.get(charge.accountId);
            const chargePayments = paymentsByCharge.get(charge.id) ?? [];
            const remaining =
              charge.type === 'INSTALLMENT'
                ? remainingBalance(charge, chargePayments)
                : null;

            return (
              <DetailSheet
                key={charge.id}
                title={charge.label}
                trigger={
                  <div className="py-3 transition-colors hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">
                        {charge.label}
                      </p>
                      <StatusBadge status={status} />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <OwnerBadge memberId={account?.memberId ?? null} />
                      <TypeBadge type={charge.type} />
                      {account && <AccountChip name={account.name} />}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {formatAmount(charge.amount, charge.currency)}
                      {charge.type === 'FIXED_RECURRING' ||
                      charge.type === 'TEMPORARY'
                        ? ' / mois'
                        : charge.type === 'INSTALLMENT'
                          ? ` × ${charge.installments ?? ''}`
                          : ''}
                    </p>
                    {charge.type === 'INSTALLMENT' && remaining !== null && (
                      <p className="text-xs font-medium text-slate-600">
                        Restant dû : {formatAmount(remaining, charge.currency)}
                      </p>
                    )}
                    {next && (
                      <p className="text-xs text-slate-400">
                        Prochaine échéance : {formatDate(next.dueDate)}
                      </p>
                    )}
                  </div>
                }
              >
                <div className="flex items-center gap-2">
                  <OwnerBadge memberId={account?.memberId ?? null} />
                  <TypeBadge type={charge.type} />
                  <StatusBadge status={status} />
                  {account && <AccountChip name={account.name} />}
                </div>
                <Separator />
                <DetailRow label="Catégorie" value={charge.category} />
                <DetailRow
                  label="Montant"
                  value={`${formatAmount(charge.amount, charge.currency)}${
                    charge.type === 'FIXED_RECURRING' ||
                    charge.type === 'TEMPORARY'
                      ? ' / mois'
                      : ''
                  }`}
                />
                {charge.type === 'INSTALLMENT' && remaining !== null && (
                  <DetailRow
                    label="Capital restant dû"
                    value={formatAmount(remaining, charge.currency)}
                  />
                )}
                {charge.provisioned && (
                  <DetailRow
                    label="Provision"
                    value={`${formatAmount(charge.amount / 12, charge.currency)} / mois`}
                  />
                )}
                {next && (
                  <DetailRow
                    label="Prochaine échéance"
                    value={formatDate(next.dueDate)}
                  />
                )}
                <DetailRow
                  label="Compte débité"
                  value={account?.name ?? charge.accountId}
                />

                {/* Échéancier complet pour charge échelonnée (Task 5.6) */}
                {charge.type === 'INSTALLMENT' && chargePayments.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-semibold text-slate-700">
                      Échéancier ({chargePayments.length} échéances)
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {chargePayments.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs"
                        >
                          <span className="text-slate-500">
                            #{idx + 1} · {formatDate(p.dueDate)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800">
                              {formatAmount(p.amount, p.currency)}
                            </span>
                            <StatusBadge
                              status={p.status === 'PAID' ? 'Payé' : 'À venir'}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Separator />
                <div className="space-y-2 pt-1">
                  <Link href={`/charges/${charge.id}/edit`} className="block">
                    <Button size="sm" className="w-full">
                      Modifier
                    </Button>
                  </Link>
                  <DeleteButton
                    label="Supprimer la charge"
                    message={`Supprimer « ${charge.label} » ? Les récurrences seront arrêtées et l'historique des paiements conservé.`}
                    onDone={() => deleteCharge(charge.id)}
                  />
                  {isDeleting && (
                    <p className="text-xs text-slate-400">Suppression…</p>
                  )}
                </div>
              </DetailSheet>
            );
          })}
        </CardContent>
      </Card>

      <Link href="/charges/new" className="block">
        <Button size="lg" className="w-full">
          <IconPlus className="h-4 w-4" /> Nouvelle charge
        </Button>
      </Link>
    </div>
  );
}
