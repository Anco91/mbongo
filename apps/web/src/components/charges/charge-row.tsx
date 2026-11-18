/**
 * Charge Row — one tappable line of the charges list: label, status, owner,
 * type, account, amount and next due date. Presentation only (design D5).
 *
 * @module Components/Charges/ChargeRow
 */

import { JSX } from 'react';
import type { Account, Charge, Payment } from '@mbongo/shared';
import {
  AccountChip,
  OwnerBadge,
  StatusBadge,
  TypeBadge,
} from '@/components/common';
import { formatAmount, formatDate } from '@/components/common/format';
import { chargeAmountLabel } from '@/lib/charges';

interface ChargeRowProps {
  charge: Charge;
  status: string;
  account: Account | undefined;
  remaining: number | null;
  next: Payment | null;
}

export function ChargeRow({
  charge,
  status,
  account,
  remaining,
  next,
}: ChargeRowProps): JSX.Element {
  return (
    <div className="cursor-pointer py-3 transition-colors hover:bg-slate-50">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-800">{charge.label}</p>
        <StatusBadge status={status} />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <OwnerBadge memberId={account?.memberId ?? null} />
        <TypeBadge type={charge.type} />
        {account && <AccountChip name={account.name} />}
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {formatAmount(charge.amount, charge.currency)}
        {chargeAmountLabel(charge)}
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
  );
}
