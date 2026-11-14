/**
 * Tests for M2 schema extensions:
 * - Account linkedAccountId invariant (CREDIT_CARD only)
 * - Payment transactionId (reconciliation link)
 * - updateChargeSchema accepts calendar fields (amount, frequency, dates,
 *   installments) used by the charge edit rule.
 *
 * @module Tests/Schemas/M2
 * @jest-environment node
 */
import {
  createAccountSchema,
  updateAccountSchema,
  createPaymentSchema,
  updatePaymentSchema,
  updateChargeSchema,
} from '@mbongo/shared';

const baseAccount = {
  name: 'Carte UBS',
  currency: 'CHF' as const,
  accountType: 'CREDIT_CARD' as const,
};

describe('linkedAccountId invariant (createAccountSchema)', () => {
  it('accepts a CREDIT_CARD with a settlement account', () => {
    const result = createAccountSchema.safeParse({
      ...baseAccount,
      linkedAccountId: 'current-ubs-0001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a CREDIT_CARD without a settlement account (required at creation)', () => {
    const result = createAccountSchema.safeParse(baseAccount);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['linkedAccountId']);
    }
  });

  it('rejects a linkedAccountId on a non-card account', () => {
    const result = createAccountSchema.safeParse({
      ...baseAccount,
      accountType: 'CURRENT',
      linkedAccountId: 'current-ubs-0001',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['linkedAccountId']);
    }
  });

  it('accepts a linkedAccountId on a non-card account when null', () => {
    const result = createAccountSchema.safeParse({
      name: 'UBS Courant',
      currency: 'CHF' as const,
      accountType: 'CURRENT' as const,
      linkedAccountId: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('linkedAccountId invariant (updateAccountSchema)', () => {
  it('rejects a linkedAccountId added to a non-card account', () => {
    const result = updateAccountSchema.safeParse({
      accountType: 'JOINT',
      linkedAccountId: 'current-bnp-0001',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['linkedAccountId']);
    }
  });

  it('accepts a linkedAccountId added to a CREDIT_CARD', () => {
    const result = updateAccountSchema.safeParse({
      accountType: 'CREDIT_CARD',
      linkedAccountId: 'current-ubs-0001',
    });
    expect(result.success).toBe(true);
  });
});

describe('payment transactionId (reconciliation)', () => {
  const basePayment = {
    chargeId: 'charge-1',
    amount: 312,
    currency: 'EUR' as const,
    dueDate: '2026-12-28T00:00:00.000Z',
  };

  it('createPaymentSchema strips transactionId (payments start unreconciled)', () => {
    const result = createPaymentSchema.safeParse({
      ...basePayment,
      transactionId: 'txn-1',
    });
    expect(result.success).toBe(true);
    // The link never exists at creation: unknown keys are stripped.
    expect('transactionId' in (result.data ?? {})).toBe(false);
  });

  it('updatePaymentSchema accepts a transactionId link', () => {
    const result = updatePaymentSchema.safeParse({
      transactionId: 'txn-1',
      status: 'PAID',
      paidAt: '2026-11-28T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('updatePaymentSchema accepts unlinking (null transactionId)', () => {
    const result = updatePaymentSchema.safeParse({
      transactionId: null,
      status: 'PENDING',
      paidAt: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('updateChargeSchema accepts calendar fields (edit rule)', () => {
  it('accepts amount, frequency, startDate, endDate and installments', () => {
    const result = updateChargeSchema.safeParse({
      amount: 1900,
      frequency: 'monthly',
      startDate: '2026-12-01T00:00:00.000Z',
      endDate: null,
      installments: 4,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a partial calendar edit (amount only)', () => {
    const result = updateChargeSchema.safeParse({ amount: 508.6 });
    expect(result.success).toBe(true);
  });
});
