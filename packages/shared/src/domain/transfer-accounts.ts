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
  _source: TransferAccountRef,
  _target: TransferAccountRef
): string | null {
  throw new Error('not implemented');
}

/** True when both accounts share a currency (no rate, no fee). */
export function isSameCurrencyTransfer(
  _source: TransferAccountRef,
  _target: TransferAccountRef
): boolean {
  throw new Error('not implemented');
}

/** Settlement of a same-currency transfer: received = sent, rate 1, fees 0. */
export function settleSameCurrencyTransfer(
  _amountSent: number
): SameCurrencySettlement {
  throw new Error('not implemented');
}
