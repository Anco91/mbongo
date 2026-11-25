/**
 * External transfer rules — a transfer to an account outside the household
 * has a SOURCE leg only (no target account, no rate, no fee). Pure, no
 * Prisma/HTTP.
 *
 * @packageDocumentation
 */

import type { TransferAccountRef } from './transfer-accounts';

/** Stub locked with spec 37: the Executor replaces the bodies. */
export function isExternalTransfer(_transfer: {
  targetAccountId: string | null;
}): boolean {
  throw new Error('not implemented');
}

/** Stub locked with spec 37: the Executor replaces the body. */
export function checkExternalTransferSource(
  _source: TransferAccountRef
): string | null {
  throw new Error('not implemented');
}
