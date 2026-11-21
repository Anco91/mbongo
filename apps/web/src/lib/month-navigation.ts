/**
 * Month Navigation Helpers
 *
 * Helpers pour la manipulation des clés mensuelles (YYYY-MM) et la navigation.
 */

import { endOfMonth, format, startOfMonth, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Retourne le libellé court d'un mois (pour le curseur).
 *
 * @param monthKey - Clé mensuelle au format "YYYY-MM"
 * @returns Libellé au format "nov. 2026"
 */
export function monthLabel(monthKey: string): string {
  const date = monthKeyToDate(monthKey);
  return format(date, 'MMM yyyy', { locale: fr });
}

/**
 * Décale une clé mensuelle de N mois.
 *
 * @param monthKey - Clé mensuelle au format "YYYY-MM"
 * @param delta - Nombre de mois (positif ou négatif)
 * @returns Nouvelle clé mensuelle
 */
export function shiftMonthKey(monthKey: string, delta: number): string {
  const date = monthKeyToDate(monthKey);
  const shifted = addMonths(date, delta);
  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Détermine la direction d'un swipe.
 *
 * @param deltaX - Déplacement horizontal
 * @param deltaY - Déplacement vertical
 * @returns 1 (suivant), -1 (précédent), 0 (rien)
 */
export function swipeDirection(deltaX: number, deltaY: number): number {
  const threshold = 80;
  if (Math.abs(deltaX) < threshold) return 0;
  if (Math.abs(deltaY) > Math.abs(deltaX)) return 0;
  return deltaX < 0 ? 1 : -1;
}

/**
 * Retourne les bornes d'un mois pour une date ou clé mensuelle.
 *
 * @param value - Date ISO ou clé mensuelle
 * @returns Objet avec start et end
 */
export function monthRange(value: string): { start: string; end: string } {
  const date = value.length === 7 ? monthKeyToDate(value) : new Date(value);
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Vérifie si une date est dans un mois donné.
 *
 * @param dateStr - Date ISO
 * @param monthKey - Clé mensuelle
 * @returns true si la date est dans le mois
 */
export function isInMonth(dateStr: string, monthKey: string): boolean {
  const date = new Date(dateStr);
  const { start, end } = monthBounds(monthKey);
  return date >= start && date <= end;
}

/**
 * Convertit une clé mensuelle en date (premier jour du mois à midi).
 *
 * @param monthKey - Clé mensuelle au format "YYYY-MM"
 * @returns Date du premier jour du mois à 12:00 (évite les problèmes de fuseau)
 *
 * @example
 * ```typescript
 * monthKeyToDate('2026-11'); // → 2026-11-01T12:00:00
 * ```
 */
export function monthKeyToDate(monthKey: string): Date {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  return new Date(year, month - 1, 1, 12, 0, 0);
}

/**
 * Retourne le libellé long d'un mois.
 *
 * @param monthKey - Clé mensuelle au format "YYYY-MM"
 * @returns Libellé au format "novembre 2026"
 *
 * @example
 * ```typescript
 * monthLongLabel('2026-11'); // → "novembre 2026"
 * ```
 */
export function monthLongLabel(monthKey: string): string {
  const date = monthKeyToDate(monthKey);
  return format(date, 'MMMM yyyy', { locale: fr });
}

/**
 * Retourne les bornes d'un mois (début et fin).
 *
 * @param monthKey - Clé mensuelle au format "YYYY-MM"
 * @returns Objet avec start et end
 *
 * @example
 * ```typescript
 * monthBounds('2026-11');
 * // → { start: 2026-11-01T00:00:00, end: 2026-11-30T23:59:59 }
 * ```
 */
export function monthBounds(monthKey: string): { start: Date; end: Date } {
  const date = monthKeyToDate(monthKey);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

/**
 * Retourne la clé mensuelle courante.
 *
 * @returns Clé mensuelle au format "YYYY-MM" pour le mois courant
 *
 * @example
 * ```typescript
 * currentMonthKey(); // → "2026-11" (si nous sommes en novembre 2026)
 * ```
 */
export function currentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Valide si une chaîne est une clé mensuelle valide.
 *
 * @param value - Chaîne à valider
 * @returns true si le format est "YYYY-MM" valide
 */
export function isValidMonthKey(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}
