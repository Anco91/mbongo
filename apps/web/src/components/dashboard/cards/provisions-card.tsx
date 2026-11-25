/**
 * Provisions Card — monthly household charge allocation.
 * Le total provisionné reste visible quelle que soit la pagination.
 *
 * @module Components/Dashboard/Cards/ProvisionsCard
 */

'use client';

import { useMemo, type JSX } from 'react';
import type { Account, Charge } from '@mbongo/shared';
import { chargeOwner, monthlyProvision } from '@mbongo/shared';
import {
  ShowMoreList,
  DetailRow,
  DetailSheet,
  OwnerBadge,
  SectionTitle,
} from '@/components/patterns';
import { AccountChip, StatusBadge } from '@/components/ui';
import { formatAmount } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProvisionsCardProps {
  charges: Charge[];
  accountsById: Map<string, Account>;
}

export function ProvisionsCard({
  charges,
  accountsById,
}: ProvisionsCardProps): JSX.Element {
  const provisionedCharges = useMemo(
    () => charges.filter((c) => c.provisioned),
    [charges]
  );
  const totalMonthly = useMemo(
    () => monthlyProvision(provisionedCharges),
    [provisionedCharges]
  );

  return (
    <div>
      <SectionTitle>Charges lissées chaque mois</SectionTitle>
      <Card>
        <CardContent className="space-y-2 pt-4">
          {provisionedCharges.length > 0 ? (
            <ShowMoreList
              items={provisionedCharges}
              renderItem={(c) => {
                const account = accountsById.get(c.accountId);
                const perMonth = c.amount / 12;

                return (
                  <DetailSheet
                    key={c.id}
                    title={c.label}
                    trigger={
                      <div className="flex items-center justify-between rounded-lg px-0 py-2 text-sm transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-slate-800">
                            {c.label}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <OwnerBadge memberId={chargeOwner(c, account)} />
                            {account && <AccountChip name={account.name} />}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            {formatAmount(perMonth, c.currency)} / mois
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatAmount(c.amount, c.currency)} / an
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <OwnerBadge memberId={chargeOwner(c, account)} />
                      <StatusBadge status="Provisionnée" />
                      {account && <AccountChip name={account.name} />}
                    </div>
                    <Separator />
                    <DetailRow
                      label="Total annuel"
                      value={formatAmount(c.amount, c.currency)}
                    />
                    <DetailRow
                      label="Lissage mensuel"
                      value={`${formatAmount(perMonth, c.currency)} / mois`}
                    />
                    <DetailRow
                      label="Compte débité"
                      value={account?.name ?? 'Compte inconnu'}
                    />
                  </DetailSheet>
                );
              }}
            />
          ) : (
            <div className="py-2 text-center text-xs text-slate-400">
              Aucune charge provisionnée
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Total provisionné
            </span>
            <span className="font-semibold text-slate-900">
              {formatAmount(totalMonthly, 'CHF')} / mois
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
