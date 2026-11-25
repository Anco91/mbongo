/** Remaining to live: non-savings balances minus due charges, in EUR. Stub, replaced by the Executor. */
import type { Account } from '../../schemas/account';

export function computeRemainingToLive(
  _accounts: Account[],
  _balances: Record<string, number>,
  _dueEur: number | null,
  _rate: number | null
): number | null {
  throw new Error('not implemented');
}
