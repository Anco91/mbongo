/** Due charges: unpaid payments of the current month, in EUR. Stub, replaced by the Executor. */
import type { Charge } from '../../schemas/charge';
import type { Payment } from '../../schemas/payment';
import type { ConsolidatedBalance } from './consolidated';

export function computeDueCharges(
  _payments: Payment[],
  _charges: Charge[],
  _today: Date,
  _rate: number | null
): number | null {
  throw new Error('not implemented');
}

export function computeNetOfDue(
  _consolidated: ConsolidatedBalance,
  _dueEur: number | null
): number | null {
  throw new Error('not implemented');
}
