/**
 * Account Chip — names the account a payment is debited from.
 *
 * @module Components/Common/AccountChip
 */

import { JSX } from 'react';

export function AccountChip({ name }: { name: string }): JSX.Element {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
      {name}
    </span>
  );
}
