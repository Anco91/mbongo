/**
 * Income Matching Domain Logic
 *
 * Transactions positives sans source de revenu (« non rapprochées ») et
 * propositions de rattachement à une source attendue. Fonctions pures.
 *
 * @packageDocumentation
 */

import type { Income } from '../schemas/income';
import type { Transaction } from '../schemas/transaction';
import type { Settlement, SettlementOptions } from './settlement';

/** Champs d'une transaction utiles au rapprochement. */
export type MatchableTransaction = Pick<
  Transaction,
  'id' | 'accountId' | 'date' | 'amount' | 'transferId' | 'incomeId' | 'budgetMonth'
>;

/** Source de revenu proposée pour une transaction, avec l'écart prévu/réalisé. */
export interface IncomeMatchProposal {
  incomeId: string;
  /** Mois confirmé `AAAA-MM` si le lien est accepté. */
  budgetMonth: string;
  settlement: Settlement;
}

/** Transaction positive non rapprochée et ses propositions, meilleure d'abord. */
export interface UnmatchedIncome {
  transactionId: string;
  accountId: string;
  date: string;
  amount: number;
  budgetMonth: string;
  proposals: IncomeMatchProposal[];
}

export function findUnmatchedIncome(
  transactions: readonly MatchableTransaction[],
  incomes: readonly Income[],
  options?: SettlementOptions
): UnmatchedIncome[] {
  void transactions;
  void incomes;
  void options;
  throw new Error('not implemented');
}
