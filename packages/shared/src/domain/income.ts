/**
 * Income Domain Logic
 *
 * Logique métier pure pour la détermination des revenus dus pour un mois donné.
 * Ces fonctions sont TESTABLES sans serveur et sans base de données.
 *
 * @packageDocumentation
 */

import { endOfMonth, isWithinInterval, parseISO, startOfMonth } from 'date-fns';
import type { Income } from '../schemas/income';
import type { CurrencyConverter } from './schedule';

/**
 * Détermine si une source de revenu est due pour un mois donné.
 *
 * Règles :
 * - Le revenu doit être actif
 * - Pour un revenu mensuel : le mois doit être >= au mois de startDate
 *   et <= au mois de endDate (si endDate existe)
 * - Pour un revenu annuel : le mois doit être le mois anniversaire
 *   de startDate et dans l'intervalle [startDate, endDate]
 *
 * @param income - La source de revenu
 * @param monthKey - Clé mensuelle au format "YYYY-MM"
 * @returns true si le revenu est dû pour ce mois
 *
 * @example
 * ```typescript
 * const income: Income = { frequency: 'monthly', startDate: '2026-01-15', ... };
 * isIncomeDueForMonth(income, '2026-11'); // true
 * isIncomeDueForMonth(income, '2025-12'); // false (avant startDate)
 * ```
 */
export function isIncomeDueForMonth(income: Income, monthKey: string): boolean {
  if (!income.active) return false;

  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(new Date(year, month - 1, 1));

  const startDate = parseISO(income.startDate);
  const endDate = income.endDate ? parseISO(income.endDate) : null;

  if (income.frequency === 'yearly') {
    // Revenu annuel : dû au mois anniversaire
    const startMonth = startDate.getMonth() + 1;
    if (startMonth !== month) return false;

    // Vérifier que le mois est dans l'intervalle [startDate, endDate]
    if (endDate) {
      return (
        isWithinInterval(monthStart, { start: startDate, end: endDate }) ||
        isWithinInterval(monthEnd, { start: startDate, end: endDate }) ||
        (monthStart <= startDate && monthEnd >= endDate)
      );
    }
    return monthStart >= startOfMonth(startDate);
  }

  // Revenu mensuel : dû chaque mois après startDate
  if (monthStart < startOfMonth(startDate)) return false;

  if (endDate && monthStart > endOfMonth(endDate)) return false;

  return true;
}

/** Montant confirmé d'une source pour un mois (transaction rattachée à un revenu). */
export interface ConfirmedIncomeEntry {
  incomeId: string | null;
  budgetMonth: string | null;
  amount: number;
}

/** Une ligne de revenu attendu : une source due, prévue ou confirmée. */
export interface ExpectedIncomeEntry {
  incomeId: string;
  amount: number;
  currency: Income['currency'];
  confirmed: boolean;
}

/** Résultat du calcul des revenus attendus d'un mois. */
export interface MonthExpectedIncomeResult {
  total: number;
  entries: ExpectedIncomeEntry[];
}

/**
 * Revenus attendus d'un mois : une ligne par source due (`isIncomeDueForMonth`).
 * Le montant confirmé du mois (transaction avec `incomeId` et `budgetMonth`
 * égal au mois) remplace le montant prévu, jamais les deux. Total converti
 * (si `convert`) et arrondi à 2 décimales.
 */
export function computeMonthExpectedIncome(
  incomes: Income[],
  confirmed: ConfirmedIncomeEntry[],
  monthKey: string,
  convert?: CurrencyConverter
): MonthExpectedIncomeResult {
  const entries: ExpectedIncomeEntry[] = incomes
    .filter((income) => isIncomeDueForMonth(income, monthKey))
    .map((income) => {
      const match = confirmed.find(
        (c) => c.incomeId === income.id && c.budgetMonth === monthKey
      );
      return {
        incomeId: income.id,
        amount: match ? match.amount : income.amount,
        currency: income.currency,
        confirmed: match !== undefined,
      };
    });

  const sum = entries.reduce(
    (acc, entry) =>
      acc + (convert?.(entry.amount, entry.currency) ?? entry.amount),
    0
  );

  return { total: roundToCents(sum), entries };
}

/** Arrondi à 2 décimales (montants monétaires). */
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}
