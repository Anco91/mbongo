/**
 * Settlement Domain Logic
 *
 * Règlement d'un élément attendu (source de revenu + mois, échéance, jambe de
 * virement) face aux montants réalisés qui lui sont rattachés.
 * Fonctions pures, sans conversion : l'appelant fournit des montants positifs
 * dans la devise de l'élément attendu.
 *
 * @packageDocumentation
 */

export type SettlementStatus = 'open' | 'partial' | 'settled' | 'discrepancy';

export interface Settlement {
  status: SettlementStatus;
  /** Montant attendu. */
  expected: number;
  /** Somme des montants réalisés, arrondie à 2 décimales. */
  realized: number;
  /** realized − expected, arrondi à 2 décimales. */
  gap: number;
}

export interface SettlementOptions {
  /** Écart absolu toléré pour considérer l'élément réglé. Défaut 0. */
  tolerance?: number;
}

/**
 * Règlement d'un élément attendu.
 *
 * - aucun montant réalisé → `open`
 * - |écart| ≤ tolérance → `settled`
 * - réalisé inférieur à l'attendu → `partial`
 * - réalisé supérieur à l'attendu → `discrepancy`
 *
 * @throws RangeError si un montant ou la tolérance est négatif ou non fini
 */
export function computeSettlement(
  expected: number,
  realized: readonly number[],
  options: SettlementOptions = {}
): Settlement {
  void expected;
  void realized;
  void options;
  throw new Error('not implemented');
}
