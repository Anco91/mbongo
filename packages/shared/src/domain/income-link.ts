/**
 * Income Link Domain Logic
 *
 * Règles pour rattacher une transaction existante à une source de revenu et
 * à un mois (`incomeId` + `budgetMonth`). Fonction pure, le serveur la rejoue.
 *
 * @packageDocumentation
 */

import type { Income } from '../schemas/income';
import type { MatchableTransaction } from './income-matching';

/** Raison du refus d'un rattachement. */
export type IncomeLinkError =
  | 'amount-not-positive'
  | 'transfer-leg'
  | 'already-linked'
  | 'payment-linked'
  | 'account-mismatch'
  | 'income-inactive'
  | 'income-not-due'
  | 'date-outside-month'
  | 'month-already-confirmed';

/** Faits nécessaires à la décision, lus en base par l'appelant. */
export interface IncomeLinkContext {
  income: Income;
  transaction: MatchableTransaction;
  /** Mois à confirmer, `AAAA-MM`. */
  month: string;
  /** Id de la transaction qui confirme déjà (source, mois), sinon null. */
  confirmedTransactionId: string | null;
  /** Une échéance de charge pointe déjà sur cette transaction. */
  hasPayment: boolean;
}

/**
 * Premier motif de refus du rattachement, ou `null` si le lien est permis.
 * Ordre des contrôles : voir `IncomeLinkError`, de haut en bas.
 */
export function checkIncomeLink(
  context: IncomeLinkContext
): IncomeLinkError | null {
  void context;
  throw new Error('not implemented');
}
