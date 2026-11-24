/**
 * Transfer Archive Domain Logic
 *
 * Un transfert clos (`CLOSED`) est rangé : masqué par défaut dans la liste.
 * Fonctions pures, sans état.
 *
 * @packageDocumentation
 */

import type { Transfer } from '../schemas/transfer';

/** Vrai si le transfert est clos. */
export function isTransferClosed(transfer: Pick<Transfer, 'status'>): boolean {
  throw new Error('not implemented');
}

/**
 * Transferts à afficher : tous si `showClosed`, sinon sans les clos.
 * L'ordre d'entrée est conservé, l'entrée n'est jamais modifiée.
 */
export function filterVisibleTransfers(
  transfers: Transfer[],
  showClosed: boolean
): Transfer[] {
  throw new Error('not implemented');
}
