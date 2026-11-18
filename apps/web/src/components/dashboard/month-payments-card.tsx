/**
 * Month Payments Card — échéances du mois choisi (M4, design D3).
 * Révélation « 3 puis tout » (toggle interne) ; chaque échéance porte
 * le badge « qui-paie » de son compte débité.
 *
 * @module Components/Dashboard/MonthPaymentsCard
 */

'use client';

import type { JSX } from 'react';
import type { Account, Charge, Payment } from '@mbongo/shared';
import { paymentDisplayStatus, paymentStatusLabel } from '@mbongo/shared';
import {
  AccountChip,
  ShowMoreList,
  DetailRow,
  DetailSheet,
  OwnerBadge,
  SectionTitle,
  StatusBadge,
} from '@/components/common';
import { formatAmount, formatDate } from '@/components/common/format';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MonthPaymentsCardProps {
  payments: Payment[];
  chargesById: Map<string, Charge>;
  accountsById: Map<string, Account>;
  now: Date;
}

export function MonthPaymentsCard({
  payments,
  chargesById,
  accountsById,
  now,
}: MonthPaymentsCardProps): JSX.Element {
  return (
    <div>
      <SectionTitle>Échéances du mois</SectionTitle>
      <Card>
        <CardContent className="divide-y divide-slate-100 pt-2">
          {payments.length > 0 ? (
            <ShowMoreList
              items={payments}
              renderItem={(p) => {
                const charge = chargesById.get(p.chargeId);
                const account = charge
                  ? accountsById.get(charge.accountId)
                  : undefined;
                const status = paymentDisplayStatus(p, now);
                const label = charge?.label ?? 'Échéance';

                return (
                  <DetailSheet
                    key={p.id}
                    title={label}
                    trigger={
                      <div className="flex items-center justify-between py-2.5 transition-colors hover:bg-slate-50 cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {label}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <OwnerBadge memberId={account?.memberId ?? null} />
                            {account && <AccountChip name={account.name} />}
                            <span className="text-[11px] text-slate-400">
                              {formatDate(p.dueDate)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatAmount(p.amount, p.currency)}
                          </span>
                          <StatusBadge status={status} />
                        </div>
                      </div>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <OwnerBadge memberId={account?.memberId ?? null} />
                      <StatusBadge status={status} />
                      {account && <AccountChip name={account.name} />}
                    </div>
                    <Separator />
                    <DetailRow
                      label="Montant"
                      value={formatAmount(p.amount, p.currency)}
                    />
                    <DetailRow label="Échéance" value={formatDate(p.dueDate)} />
                    <DetailRow
                      label="Compte débité"
                      value={account?.name ?? 'Compte inconnu'}
                    />
                    <DetailRow
                      label="Statut"
                      value={paymentStatusLabel(status)}
                    />
                    {charge?.category && (
                      <DetailRow label="Catégorie" value={charge.category} />
                    )}
                  </DetailSheet>
                );
              }}
            />
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Aucune échéance ce mois-ci
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
