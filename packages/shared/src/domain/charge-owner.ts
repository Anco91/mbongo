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
  void charge;
  void account;
  throw new Error('not implemented');
}

/** Select value → persisted fields: `''` follows the account, `'shared'` is common. */
export function ownerChoiceToFields(choice: ChargeOwnerChoice): {
  memberId: string | null;
  shared: boolean;
} {
  void choice;
  throw new Error('not implemented');
}

/** Persisted fields → select value (inverse of `ownerChoiceToFields`). */
export function fieldsToOwnerChoice(charge: {
  memberId?: string | null;
  shared?: boolean;
}): ChargeOwnerChoice {
  void charge;
  throw new Error('not implemented');
}
