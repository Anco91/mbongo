/**
 * Income Matching Domain Logic
 *
 * Transactions positives sans source de revenu (« non rapprochées ») et
 * propositions de rattachement à une source attendue. Fonctions pures.
 *
 * @packageDocumentation
 */

import { format, parseISO } from 'date-fns';

import type { Income } from '../schemas/income';
import type { Transaction } from '../schemas/transaction';
import { isIncomeDueForMonth } from './income';
import { computeSettlement, type Settlement, type SettlementOptions } from './settlement';

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

/**
 * Transactions positives sans source ni virement, avec les sources proposées.
 *
 * Mois = mois de la date de la transaction. Une source déjà confirmée ce mois-là
 * n'est pas proposée. Propositions triées par |écart| puis `incomeId`;
 * transactions triées par date puis id. Fonction pure, entrées non modifiées.
 */
export function findUnmatchedIncome(
  transactions: readonly MatchableTransaction[],
  incomes: readonly Income[],
  options?: SettlementOptions
): UnmatchedIncome[] {
  const confirmed = new Set(
    transactions.flatMap((t) => (t.incomeId && t.budgetMonth ? [confirmationKey(t.incomeId, t.budgetMonth)] : []))
  );

  return transactions
    .filter(isUnmatched)
    .map((t) => {
      const budgetMonth = format(parseISO(t.date), 'yyyy-MM');
      return {
        transactionId: t.id,
        accountId: t.accountId,
        date: t.date,
        amount: t.amount,
        budgetMonth,
        proposals: proposeIncomes(t, budgetMonth, incomes, confirmed, options),
      };
    })
    .sort((a, b) => compareText(a.date, b.date) || compareText(a.transactionId, b.transactionId));
}

function isUnmatched(t: MatchableTransaction): boolean {
  return t.amount > 0 && !t.transferId && !t.incomeId;
}

function confirmationKey(incomeId: string, budgetMonth: string): string {
  return `${incomeId}|${budgetMonth}`;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function proposeIncomes(
  t: MatchableTransaction,
  budgetMonth: string,
  incomes: readonly Income[],
  confirmed: ReadonlySet<string>,
  options?: SettlementOptions
): IncomeMatchProposal[] {
  return incomes
    .filter(
      (i) =>
        i.accountId === t.accountId &&
        !confirmed.has(confirmationKey(i.id, budgetMonth)) &&
        isIncomeDueForMonth(i, budgetMonth)
    )
    .map((i) => ({
      incomeId: i.id,
      budgetMonth,
      settlement: computeSettlement(i.amount, [t.amount], options),
    }))
    .sort(
      (a, b) =>
        Math.abs(a.settlement.gap) - Math.abs(b.settlement.gap) || compareText(a.incomeId, b.incomeId)
    );
}
