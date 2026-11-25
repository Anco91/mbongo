/**
 * Remaining to live: balances of active non-savings accounts minus due
 * charges, in EUR.
 *
 * @packageDocumentation
 */
import type { Account } from '../../schemas/account';
import { counterValue } from '../../domain/conversion';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * @param rate - CHF → EUR rate, or null when unknown
 * @returns EUR amount, or null when due charges or a needed rate is missing
 */
export function computeRemainingToLive(
  accounts: Account[],
  balances: Record<string, number>,
  dueEur: number | null,
  rate: number | null
): number | null {
  if (dueEur === null) return null;
  let total = 0;
  for (const account of accounts) {
    if (account.status !== 'ACTIVE' || account.accountType === 'SAVINGS') {
      continue;
    }
    const balance = balances[account.id] ?? account.openingBalance ?? 0;
    if (account.currency === 'CHF') {
      if (rate === null) return null;
      total += counterValue(balance, rate);
    } else {
      total += balance;
    }
  }
  return round2(total - dueEur);
}
