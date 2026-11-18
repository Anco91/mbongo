/**
 * Month navigation — pure helpers for the dashboard month cursor
 * (M4, design D3). No React: fully testable.
 *
 * @module Components/Dashboard/MonthNavigation
 */

/** Clé mois locale 'YYYY-MM' (défaut du curseur : mois courant). */
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Décale une clé 'YYYY-MM' de n mois (n négatif = mois précédents). */
export function shiftMonthKey(key: string, delta: number): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Libellé FR court du mois, ex. « nov. 2026 ». */
export function monthLabel(key: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${key}-01T12:00:00`));
}

/**
 * Décision de swipe pure (testable sans DOM) : seuil horizontal 60 px
 * et dominance sur la vertical (×1.5) pour ne pas voler le scroll.
 * Retourne +1 (mois suivant, swipe gauche), -1 (précédent) ou 0.
 */
export function swipeDirection(dx: number, dy: number): number {
  if (Math.abs(dx) <= 60 || Math.abs(dx) <= Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}
