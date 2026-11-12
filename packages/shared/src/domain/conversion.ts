/**
 * Conversion Domain Logic
 *
 * Fonctions pures de conversion monétaire pour les transferts CHF → EUR.
 * Ces fonctions sont TESTABLES sans serveur et sans base de données.
 *
 * @packageDocumentation
 */

// ============================================================================
// Fonctions de Conversion
// ============================================================================

/**
 * Calcule la contre-valeur d'un montant au taux donné, arrondie à 2 décimales.
 *
 * @param amount - Montant source (ex: CHF)
 * @param rate - Taux de change (ex: 0.9231)
 * @returns Contre-valeur arrondie à 2 décimales
 *
 * @example
 * ```typescript
 * counterValue(1500, 0.9231)
 * // → 1384.65
 * ```
 */
export function counterValue(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Calcule le taux de change effectif à partir des montants réels, arrondi à 5 décimales.
 *
 * @param amountReceived - Montant effectivement reçu (EUR)
 * @param amountSent - Montant envoyé (CHF)
 * @returns Taux effectif arrondi à 5 décimales
 *
 * @example
 * ```typescript
 * effectiveRate(1380.00, 1500)
 * // → 0.92
 * ```
 */
export function effectiveRate(
  amountReceived: number,
  amountSent: number
): number {
  return Math.round((amountReceived / amountSent) * 100000) / 100000;
}

/**
 * Calcule les frais de transfert (écart entre montant estimé et montant reçu),
 * arrondi à 2 décimales.
 *
 * @param amountEstimated - Contre-valeur estimée (EUR)
 * @param amountReceived - Montant effectivement reçu (EUR)
 * @returns Frais arrondis à 2 décimales
 *
 * @example
 * ```typescript
 * transferFees(1384.65, 1380.00)
 * // → 4.65
 * ```
 */
export function transferFees(
  amountEstimated: number,
  amountReceived: number
): number {
  return Math.round((amountEstimated - amountReceived) * 100) / 100;
}
