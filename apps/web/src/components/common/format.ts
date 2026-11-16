/**
 * Display formatting helpers (client-side presentation only).
 *
 * @module Components/Common/Format
 */

/** French-CH currency formatting, 2 decimals. */
export function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Compact date, French style (ex. 1ᵉʳ nov. 2026 → 01/11/2026 free form). */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(
    new Date(iso)
  );
}
