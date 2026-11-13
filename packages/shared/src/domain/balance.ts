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
