/**
 * Balance Domain Logic
 *
 * Fonctions pures de calcul de solde et de découvert.
 * Zéro dépendance React/Next/Prisma — testables sans infrastructure.
 *
 * @packageDocumentation
 */

// ============================================================================
// Fonctions de Calcul
// ============================================================================

/**
 * Calcule le solde courant d'un compte.
 *
 * Le solde est la somme de l'`openingBalance` et de tous les montants signés
 * des transactions (positif = crédit, négatif = débit).
 *
 * @param account - Compte avec son solde d'ouverture
 * @param transactions - Liste des transactions sur ce compte
 * @returns Solde calculé
 *
 * @example
 * ```typescript
 * const account = { openingBalance: 1000 };
 * const transactions = [{ amount: -200 }, { amount: 500 }];
 * computeBalance(account, transactions); // 1300
 * ```
 */
export function computeBalance(
  account: { openingBalance: number },
  transactions: Array<{ amount: number }>
): number {
  return transactions.reduce(
    (sum, tx) => sum + tx.amount,
    account.openingBalance
  );
}

/**
 * Calcule l'écart entre un snapshot de solde et le solde calculé.
 *
 * Un écart positif signifie que le snapshot est supérieur au solde calculé
 * (crédit non enregistré). Un écart négatif signifie l'inverse (débit manquant).
 *
 * @param snapshot - Snapshot de solde enregistré manuellement
 * @param calculatedBalance - Solde calculé via `computeBalance`
 * @returns Écart algébrique (snapshot.balance − calculatedBalance)
 *
 * @example
 * ```typescript
 * const snapshot = { balance: 1500 };
 * computeSnapshotGap(snapshot, 1300); // 200
 * ```
 */
export function computeSnapshotGap(
  snapshot: { balance: number },
  calculatedBalance: number
): number {
  return snapshot.balance - calculatedBalance;
}

/**
 * Détermine si un compte est en découvert.
 *
 * Un compte est en découvert si son solde est inférieur à l'opposé de sa limite
 * de découvert autorisée. Par exemple, avec `overdraftLimit = 500`, le compte
 * est en découvert si `balance < -500`.
 *
 * @param account - Compte avec sa limite de découvert autorisée
 * @param balance - Solde courant du compte
 * @returns `true` si le compte est en découvert, `false` sinon
 *
 * @example
 * ```typescript
 * const account = { overdraftLimit: 500 };
 * isOverdraft(account, -600); // true
 * isOverdraft(account, -500); // false (à la limite exacte)
 * isOverdraft(account, 100);  // false
 * ```
 */
export function isOverdraft(
  account: { overdraftLimit: number },
  balance: number
): boolean {
  return balance < -account.overdraftLimit;
}

const DAY_LENGTH = 10;

/** Jour calendaire (YYYY-MM-DD) d'une date ISO. */
function toDay(date: string): string {
  return date.slice(0, DAY_LENGTH);
}

/**
 * Écart du dernier relevé d'un compte, calculé à la date du relevé.
 *
 * Compare le dernier relevé (date la plus récente, départage par `createdAt`)
 * au solde calculé avec les transactions du compte jusqu'au jour du relevé
 * inclus. Écart = relevé − calculé, arrondi au centime.
 *
 * @returns `null` si le compte n'a aucun relevé
 */
export function computeStatementGap(
  account: { id: string; openingBalance: number },
  transactions: Array<{ accountId: string; date: string; amount: number }>,
  snapshots: Array<{
    accountId: string;
    date: string;
    balance: number;
    createdAt: string;
  }>
): { snapshotDate: string; calculated: number; gap: number } | null {
  const latest = snapshots
    .filter((snapshot) => snapshot.accountId === account.id)
    .reduce<(typeof snapshots)[number] | null>((best, snapshot) => {
      if (!best) return snapshot;
      const byDate = toDay(snapshot.date).localeCompare(toDay(best.date));
      if (byDate !== 0) return byDate > 0 ? snapshot : best;
      return snapshot.createdAt > best.createdAt ? snapshot : best;
    }, null);
  if (!latest) return null;

  const snapshotDay = toDay(latest.date);
  const calculated = computeBalance(
    account,
    transactions.filter(
      (tx) => tx.accountId === account.id && toDay(tx.date) <= snapshotDay
    )
  );
  const gap =
    Math.round(computeSnapshotGap(latest, calculated) * 100) / 100 + 0; // + 0 turns -0 into 0

  return { snapshotDate: snapshotDay, calculated, gap };
}

/**
 * ADVISOR STUB (spec 38): balance of an account at the end of `asOf`'s UTC day.
 * Opening balance plus the account's transactions dated on or before that day.
 */
export function balanceAsOf(
  account: { id: string; openingBalance: number },
  transactions: Array<{ accountId: string; date: string; amount: number }>,
  asOf: Date
): number {
  void account;
  void transactions;
  void asOf;
  throw new Error('balanceAsOf: not implemented (spec 38)');
}
