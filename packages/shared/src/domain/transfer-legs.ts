/**
 * Transfer leg check — verifies that each leg of a transfer matches its
 * Transfer record. SOURCE leg = -amountSent, TARGET leg = +amountReceived;
 * rate and fees explain the gap between estimated and received. Legs are
 * never summed against each other (two currencies). Pure, no Prisma/HTTP.
 *
 * @packageDocumentation
 */

import { counterValue, transferFees } from './conversion';

// ============================================================================
// Types
// ============================================================================

/** Transfer record fields used by the leg check. */
export interface TransferLegsSource {
  sourceAccountId: string;
  targetAccountId: string;
  amountSent: number;
  rateEstimated: number;
  amountReceived: number | null;
  fees: number | null;
  status: 'ESTIMATED' | 'COMPLETED' | 'CLOSED';
}

/** One ledger leg attached to a transfer. */
export interface TransferLegInput {
  accountId: string;
  transferRole: 'SOURCE' | 'TARGET';
  amount: number;
}

/** Inconsistency codes returned by {@link checkTransferLegs}. */
export type TransferLegIssue =
  | 'SOURCE_MISSING'
  | 'SOURCE_DUPLICATE'
  | 'SOURCE_ACCOUNT'
  | 'SOURCE_AMOUNT'
  | 'TARGET_MISSING'
  | 'TARGET_DUPLICATE'
  | 'TARGET_ACCOUNT'
  | 'TARGET_AMOUNT'
  | 'TARGET_UNEXPECTED'
  | 'AMOUNT_RECEIVED_MISSING'
  | 'FEES_GAP';

// ============================================================================
// Constants
// ============================================================================

/** Float tolerance when comparing leg amounts (half a cent). */
const AMOUNT_TOLERANCE = 0.005;

/** Tolerance when comparing fees with the estimated-minus-received gap (one cent). */
const FEES_TOLERANCE = 0.01;

// ============================================================================
// Helpers
// ============================================================================

function isAmountOff(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) > AMOUNT_TOLERANCE;
}

function sourceIssues(
  transfer: TransferLegsSource,
  legs: TransferLegInput[]
): TransferLegIssue[] {
  if (legs.length === 0) return ['SOURCE_MISSING'];
  const issues: TransferLegIssue[] =
    legs.length > 1 ? ['SOURCE_DUPLICATE'] : [];
  for (const leg of legs) {
    if (leg.accountId !== transfer.sourceAccountId)
      issues.push('SOURCE_ACCOUNT');
    if (isAmountOff(leg.amount, -transfer.amountSent))
      issues.push('SOURCE_AMOUNT');
  }
  return issues;
}

function targetIssues(
  transfer: TransferLegsSource,
  legs: TransferLegInput[]
): TransferLegIssue[] {
  if (transfer.amountReceived === null) {
    return legs.length > 0 ? ['TARGET_UNEXPECTED'] : [];
  }
  if (legs.length === 0) {
    return transfer.status !== 'ESTIMATED' ? ['TARGET_MISSING'] : [];
  }
  const issues: TransferLegIssue[] =
    legs.length > 1 ? ['TARGET_DUPLICATE'] : [];
  for (const leg of legs) {
    if (leg.accountId !== transfer.targetAccountId)
      issues.push('TARGET_ACCOUNT');
    if (isAmountOff(leg.amount, transfer.amountReceived))
      issues.push('TARGET_AMOUNT');
  }
  return issues;
}

function receivedIssues(transfer: TransferLegsSource): TransferLegIssue[] {
  return transfer.status === 'COMPLETED' && transfer.amountReceived === null
    ? ['AMOUNT_RECEIVED_MISSING']
    : [];
}

function feesIssues(transfer: TransferLegsSource): TransferLegIssue[] {
  if (transfer.status !== 'COMPLETED' || transfer.amountReceived === null) {
    return [];
  }
  if (transfer.fees === null) return ['FEES_GAP'];
  const estimated = counterValue(transfer.amountSent, transfer.rateEstimated);
  const expectedFees = transferFees(estimated, transfer.amountReceived);
  return Math.abs(transfer.fees - expectedFees) > FEES_TOLERANCE
    ? ['FEES_GAP']
    : [];
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Checks each leg of a transfer against its Transfer record.
 *
 * @param transfer - Transfer record (amounts, rate, fees, status)
 * @param legs - Ledger legs attached to the transfer (SOURCE and/or TARGET)
 * @returns Distinct issue codes; empty when the legs are consistent
 *
 * @example
 * ```typescript
 * checkTransferLegs(transfer, [sourceLeg, targetLeg])
 * // → [] when both legs match the record
 * ```
 */
export function checkTransferLegs(
  transfer: TransferLegsSource,
  legs: TransferLegInput[]
): TransferLegIssue[] {
  const sources = legs.filter((leg) => leg.transferRole === 'SOURCE');
  const targets = legs.filter((leg) => leg.transferRole === 'TARGET');
  return [
    ...new Set([
      ...sourceIssues(transfer, sources),
      ...targetIssues(transfer, targets),
      ...receivedIssues(transfer),
      ...feesIssues(transfer),
    ]),
  ];
}
