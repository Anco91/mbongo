/**
 * Charges Content Component
 *
 * Client presentation (maquette `ChargesScreen`): member and type filters,
 * tappable charge rows opening a bottom-sheet detail. Composition only —
 * state and derivations live in `useChargesView`, row and detail have their
 * own files (design D5). Data comes from the hydration boundary
 * (ChargesGuard); mutations go through the domain hooks (R6).
 *
 * @module Components/Charges/ChargesContent
 */

'use client';

import { JSX } from 'react';
import Link from 'next/link';
import { remainingBalance } from '@mbongo/shared';
import { ShowMoreList, DetailSheet } from '@/components/patterns';
import { MemberFilterChips } from '@/components/patterns/member-filter-chips';
import { FilterChips } from '@/components/patterns/filter-chips';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IconPlus } from '@/components/ui/icons';
import { CHARGE_FILTERS, type ChargeFilter } from '@/lib/charges';
import { chargeStatus } from '@/lib/charges';
import { useChargesView } from '@/components/charges/use-charges-view';
import { ChargeRow } from '@/components/charges/charge-row';
import { ChargeDetail } from '@/components/charges/charge-detail';

export function ChargesContent(): JSX.Element {
  const view = useChargesView();
  const filterItems = CHARGE_FILTERS.map((value) => ({ value, label: value }));

  return (
    <div className="space-y-3">
      <MemberFilterChips
        members={view.members}
        value={view.selectedMember}
        onChange={view.setSelectedMember}
      />

      <FilterChips
        items={filterItems}
        value={view.filter}
        onChange={(value) => view.setFilter(value as ChargeFilter)}
      />

      <Card>
        <CardContent className="divide-y divide-slate-100 pt-2">
          <ShowMoreList
            key={`${view.selectedMember}-${view.filter}`}
            items={view.visible}
            renderItem={(charge) => {
              const next = view.nextByCharge.get(charge.id) ?? null;
              const status = chargeStatus(charge, next);
              const account = view.accountsById.get(charge.accountId);
              const payments = view.paymentsByCharge.get(charge.id) ?? [];
              const remaining =
                charge.type === 'INSTALLMENT'
                  ? remainingBalance(charge, payments)
                  : null;

              return (
                <DetailSheet
                  key={charge.id}
                  title={charge.label}
                  trigger={
                    <ChargeRow
                      charge={charge}
                      status={status}
                      account={account}
                      remaining={remaining}
                      next={next}
                    />
                  }
                >
                  <ChargeDetail
                    charge={charge}
                    status={status}
                    account={account}
                    remaining={remaining}
                    next={next}
                    payments={payments}
                    isDeleting={view.isDeleting}
                    onDelete={view.deleteCharge}
                  />
                </DetailSheet>
              );
            }}
          />
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
