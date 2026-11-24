/**
 * Transfer account rules — which account pairs may exchange money and how a
 * same-currency transfer settles. Pure functions, no Prisma/HTTP.
 *
 * @packageDocumentation
 */

import type { AccountCurrency } from '../schemas/account';

/** Fields of an account used by transfer rules. */
export interface TransferAccountRef {
  id: string;
  currency: AccountCurrency;
  status: 'ACTIVE' | 'CLOSED';
}

/** Settlement of a same-currency transfer (no rate, no fee). */
export interface SameCurrencySettlement {
  rateEstimated: number;
  rateEffective: number;
  amountReceived: number;
  fees: number;
}

/** First refusal reason for the pair, or null when the transfer is allowed. */
export function checkTransferAccounts(
  source: TransferAccountRef,
  target: TransferAccountRef
): string | null {
  if (source.id === target.id) {
    return 'Target account must be different from source account';
  }
  if (source.status === 'CLOSED') return 'Source account is closed';
  if (target.status === 'CLOSED') return 'Target account is closed';
  return null;
}

/** True when both accounts share a currency (no rate, no fee). */
export function isSameCurrencyTransfer(
  source: TransferAccountRef,
  target: TransferAccountRef
): boolean {
  return source.currency === target.currency;
}

/** Settlement of a same-currency transfer: received = sent, rate 1, fees 0. */
export function settleSameCurrencyTransfer(
  amountSent: number
): SameCurrencySettlement {
  return {
    rateEstimated: 1,
    rateEffective: 1,
    amountReceived: amountSent,
    fees: 0,
  };
}
