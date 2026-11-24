/**
 * scopeToMember — restricts chart inputs to the accounts of one household
 * member (and what points at them). `null` keeps the whole household.
 * Pure, no mutation; same shape as `excludeClosedAccounts`.
 *
 * @module Shared/Calculation/MemberScope
 */
import type { AccountScopedData } from './active-accounts';

export function scopeToMember(
  _input: AccountScopedData,
  _memberId: string | null
): AccountScopedData {
  throw new Error('not implemented');
}
