/**
 * Account presentation helpers — pure view-model for the accounts list
 * (design D5): balance, savings progress, card billing and settlement name
 * are computed once, outside the render.
 *
 * @module Lib/Accounts
 */

import {
  cardBilling,
  computeBalance,
  type Account,
  type Transaction,
} from '@mbongo/shared';

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CURRENT: 'Compte principal',
  CREDIT_CARD: 'Carte de crédit',
  JOINT: 'Compte joint',
  SAVINGS: 'Épargne',
};

/** Known statutory ceiling (Livret A, per person) — display only. */
export const LIVRET_A_CEILING = 22950;

export type CardBillingView = ReturnType<typeof cardBilling>;

export interface AccountCardView {
  account: Account;
  status: Account['status'];
  balance: number;
  savingsProgress: number | null;
  billing: CardBillingView | null;
  settlementName: string | null;
}

/** Build the ready-to-render view of each account. */
export function buildAccountCards(
  accounts: Account[],
  transactions: Transaction[],
  now: Date = new Date()
): AccountCardView[] {
  const accountsById = new Map(
    accounts.map((account) => [account.id, account])
  );

  return accounts.map((account) => {
    const accountTransactions = transactions.filter(
      (transaction) => transaction.accountId === account.id
    );
    const balance = computeBalance(account, accountTransactions);
    // M2 (spec deferred-card) : encours carte calculé à la volée, jamais stocké.
    const isCard =
      account.accountType === 'CREDIT_CARD' || account.deferredCard;
    const billing = isCard
      ? cardBilling(account, accountTransactions, now)
      : null;
    const settlement = billing
      ? accountsById.get(billing.settlementAccountId)
      : undefined;
    const savingsProgress =
      account.accountType === 'SAVINGS' && account.currency === 'EUR'
        ? Math.min(100, (account.openingBalance / LIVRET_A_CEILING) * 100)
        : null;

    return {
      account,
      status: account.status,
      balance,
      savingsProgress,
      billing,
      settlementName: settlement?.name ?? null,
    };
  });
}
