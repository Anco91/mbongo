/**
 * Budget Domain Logic
 *
 * Logique métier pure pour le calcul des revenus d'un mois.
 * Ces fonctions sont TESTABLES sans serveur et sans base de données.
 *
 * @packageDocumentation
 */

import { parseISO } from 'date-fns';
import type { CurrencyConverter } from './schedule';

// Re-export pour compatibilité
export type { CurrencyConverter };

/** Entrée de revenu pour le calcul mensuel. */
export interface MonthIncomeEntry {
  amount: number;
  date: string;
  transferId: string | null;
  currency: 'CHF' | 'EUR';
}

/** Résultat du calcul des revenus d'un mois. */
export interface MonthIncomeResult {
  total: number;
  entries: MonthIncomeEntry[];
}

// ============================================================================
// Fonctions
// ============================================================================

/**
 * Calcule le total des revenus pour un mois donné.
 *
 * Règles :
 * - Exclut les transferts (transferId !== null)
 * - Exclut les montants négatifs ou nuls
 * - Exclut les entrées hors du mois
 * - Applique le convertisseur de devise si fourni
 *
 * @param entries - Liste des entrées de revenu
 * @param monthKey - Clé mensuelle au format "YYYY-MM"
 * @param convert - Convertisseur de devise optionnel
 * @returns Total arrondi à 2 décimales et entrées incluses
 *
 * @example
 * ```typescript
 * const entries: MonthIncomeEntry[] = [
 *   { amount: 4400, date: '2026-11-01', transferId: null, currency: 'CHF' },
 *   { amount: 500, date: '2026-11-15', transferId: null, currency: 'EUR' },
 *   { amount: 300, date: '2026-11-10', transferId: 'tx-1', currency: 'CHF' }, // exclu
 * ];
 *
 * const result = computeMonthIncome(entries, '2026-11');
 * // result.total = 4900 (4400 + 500)
 * ```
 */
export function computeMonthIncome(
  entries: MonthIncomeEntry[],
  monthKey: string,
  convert?: CurrencyConverter
): MonthIncomeResult {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const filtered = entries.filter((entry) => {
    // Exclure les transferts
    if (entry.transferId !== null) return false;

    // Exclure les montants négatifs ou nuls
    if (entry.amount <= 0) return false;

    // Vérifier que l'entrée est dans le mois
    const entryDate = parseISO(entry.date);
    const entryYear = entryDate.getFullYear();
    const entryMonth = entryDate.getMonth() + 1;

    return entryYear === year && entryMonth === month;
  });

  const total = filtered.reduce((sum, entry) => {
    const amount = convert
      ? convert(entry.amount, entry.currency)
      : entry.amount;
    return sum + amount;
  }, 0);

  return {
    total: round2(total),
    entries: filtered,
  };
}

/**
 * Arrondit à 2 décimales.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
