/**
 * External transfer rules — a transfer to an account outside the household
 * has a SOURCE leg only (no target account, no rate, no fee). Pure, no
 * Prisma/HTTP.
 *
 * @packageDocumentation
 */

import type { TransferAccountRef } from './transfer-accounts';

/** True when the transfer has no target account (recipient outside the household). */
export function isExternalTransfer(transfer: {
  targetAccountId: string | null;
}): boolean {
  return transfer.targetAccountId === null;
}

/** Refusal reason for the source of an external transfer, or null when allowed. */
export function checkExternalTransferSource(
  source: TransferAccountRef
): string | null {
  return source.status === 'CLOSED' ? 'Source account is closed' : null;
}
