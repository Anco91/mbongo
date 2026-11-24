/**
 * Income Link Domain Logic
 *
 * Règles pour rattacher une transaction existante à une source de revenu et
 * à un mois (`incomeId` + `budgetMonth`). Fonction pure, le serveur la rejoue.
 *
 * @packageDocumentation
 */

import { format, parseISO } from 'date-fns';
import type { Income } from '../schemas/income';
import type { MatchableTransaction } from './income-matching';
import { isIncomeDueForMonth } from './income';

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
  const { income, transaction, month } = context;
  if (transaction.amount <= 0) return 'amount-not-positive';
  if (transaction.transferId) return 'transfer-leg';
  if (transaction.incomeId) return 'already-linked';
  if (context.hasPayment) return 'payment-linked';
  if (transaction.accountId !== income.accountId) return 'account-mismatch';
  if (!income.active) return 'income-inactive';
  if (!isIncomeDueForMonth(income, month)) return 'income-not-due';
  if (format(parseISO(transaction.date), 'yyyy-MM') !== month) {
    return 'date-outside-month';
  }
  if (context.confirmedTransactionId !== null) return 'month-already-confirmed';
  return null;
}
