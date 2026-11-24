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
  const tolerance = options.tolerance ?? 0;
  assertAmount(expected, 'expected');
  assertAmount(tolerance, 'tolerance');
  realized.forEach((amount) => assertAmount(amount, 'realized'));

  const sum = roundToCents(realized.reduce((acc, amount) => acc + amount, 0));
  const gap = roundToCents(sum - expected);

  if (realized.length === 0) {
    return { status: 'open', expected, realized: 0, gap };
  }

  return {
    status: resolveStatus(gap, tolerance),
    expected,
    realized: sum,
    gap,
  };
}

/** Statut d'un élément réalisé (au moins un montant), à partir de l'écart arrondi. */
function resolveStatus(gap: number, tolerance: number): SettlementStatus {
  if (Math.abs(gap) <= tolerance) return 'settled';
  return gap < 0 ? 'partial' : 'discrepancy';
}

/** Montant positif et fini, sinon erreur de domaine. */
function assertAmount(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `${label} must be a finite non-negative number, got ${value}`
    );
  }
}

/** Arrondi à 2 décimales (montants monétaires), même principe que `income.ts`. */
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
