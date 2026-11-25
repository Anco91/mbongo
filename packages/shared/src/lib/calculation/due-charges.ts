/**
 * Due charges: unpaid payments due up to the end of the current month
 * (overdue ones included, later months excluded), in EUR.
 * Provisioned charges are excluded (already set aside, no double count).
 *
 * @packageDocumentation
 */
import { parseISO } from 'date-fns';
import type { Charge } from '../../schemas/charge';
import type { Payment } from '../../schemas/payment';
import { counterValue } from '../../domain/conversion';
import type { ConsolidatedBalance } from './consolidated';
import { monthRange } from './month';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Sum of PENDING payments due on or before the end of the month of `today`, in EUR.
 * `null` when a CHF payment needs a missing rate.
 *
 * @param rate - CHF → EUR rate, or null when unknown
 */
export function computeDueCharges(
  payments: Payment[],
  charges: Charge[],
  today: Date,
  rate: number | null
): number | null {
  const range = monthRange(today.toISOString());
  const provisioned = new Set(
    charges.filter((c) => c.provisioned).map((c) => c.id)
  );
  let total = 0;
  for (const payment of payments) {
    if (payment.status !== 'PENDING') continue;
    if (parseISO(payment.dueDate) > range.end) continue;
    if (provisioned.has(payment.chargeId)) continue;
    if (payment.currency === 'CHF') {
      if (rate === null) return null;
      total += counterValue(payment.amount, rate);
    } else {
      total += payment.amount;
    }
  }
  return round2(total);
}

/** Net total: gross consolidated EUR minus due charges; null if either is unknown. */
export function computeNetOfDue(
  consolidated: ConsolidatedBalance,
  dueEur: number | null
): number | null {
  if (consolidated.totalEur === null || dueEur === null) return null;
  return round2(consolidated.totalEur - dueEur);
}
