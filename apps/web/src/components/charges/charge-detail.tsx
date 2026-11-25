/**
 * Charge Detail — bottom-sheet body of one charge: badges, key rows,
 * installment plan and the modify/delete actions (design D5).
 *
 * @module Components/Charges/ChargeDetail
 */

import { JSX } from 'react';
import Link from 'next/link';
import {
  chargeOwner,
  type Account,
  type Charge,
  type Payment,
} from '@mbongo/shared';
import { DeleteButton, DetailRow, OwnerBadge } from '@/components/patterns';
import { AccountChip, StatusBadge, TypeBadge } from '@/components/ui';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { formatAmount, formatDate } from '@/lib/format';
import { chargeAmountLabel } from '@/lib/charges';
import { ChargeScheduleList } from '@/components/charges/charge-schedule-list';

interface ChargeDetailProps {
  charge: Charge;
  status: string;
  account: Account | undefined;
  remaining: number | null;
  next: Payment | null;
  payments: Payment[];
  onDelete: (id: string) => Promise<unknown>;
}

export function ChargeDetail({
  charge,
  status,
  account,
  remaining,
  next,
  payments,
  onDelete,
}: ChargeDetailProps): JSX.Element {
  return (
    <>
      <div className="flex items-center gap-2">
        <OwnerBadge memberId={chargeOwner(charge, account)} />
        <TypeBadge type={charge.type} />
        <StatusBadge status={status} />
        {account && <AccountChip name={account.name} />}
      </div>
      <Separator />
      <DetailRow label="Catégorie" value={charge.category} />
      {charge.subcategory && (
        <DetailRow label="Sous-catégorie" value={charge.subcategory} />
      )}
      <DetailRow
        label="Montant"
        value={`${formatAmount(charge.amount, charge.currency)}${chargeAmountLabel(charge)}`}
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

      {charge.type === 'INSTALLMENT' && payments.length > 0 && (
        <>
          <Separator />
          <ChargeScheduleList payments={payments} />
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
          onConfirmed={() => onDelete(charge.id)}
        />
      </div>
    </>
  );
}
