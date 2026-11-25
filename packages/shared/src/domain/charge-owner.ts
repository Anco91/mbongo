/**
 * Charge owner — who a charge belongs to: an explicit member, the household
 * (common), or, by default, whoever owns the debited account. Pure.
 *
 * @module Shared/Domain/ChargeOwner
 */
import type { Account } from '../schemas/account';
import type { Charge } from '../schemas/charge';

/** Value of the « Propriétaire / débiteur » select. */
export type ChargeOwnerChoice = '' | 'shared' | (string & {});

/** Owner member id, or `null` when the charge is common to the household. */
export function chargeOwner(
  charge: Pick<Charge, 'accountId'> & {
    memberId?: string | null;
    shared?: boolean;
  },
  account: Pick<Account, 'memberId'> | undefined
): string | null {
  if (charge.shared === true) return null;
  return charge.memberId ?? account?.memberId ?? null;
}

/** Select value → persisted fields: `''` follows the account, `'shared'` is common. */
export function ownerChoiceToFields(choice: ChargeOwnerChoice): {
  memberId: string | null;
  shared: boolean;
} {
  if (choice === 'shared') return { memberId: null, shared: true };
  if (choice === '') return { memberId: null, shared: false };
  return { memberId: choice, shared: false };
}

/** Persisted fields → select value (inverse of `ownerChoiceToFields`). */
export function fieldsToOwnerChoice(charge: {
  memberId?: string | null;
  shared?: boolean;
}): ChargeOwnerChoice {
  if (charge.shared === true) return 'shared';
  return charge.memberId ?? '';
}
