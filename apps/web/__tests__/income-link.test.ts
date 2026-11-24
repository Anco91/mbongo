/**
 * Tests for checkIncomeLink — règles de rattachement d'une transaction
 * existante à une source de revenu et un mois.
 */

import {
  checkIncomeLink,
  linkIncomeSchema,
  type Income,
  type IncomeLinkContext,
  type MatchableTransaction,
} from '@mbongo/shared';

const stamp = '2026-01-01T00:00:00.000Z';

function income(overrides: Partial<Income> = {}): Income {
  return {
    id: 'inc-1',
    label: 'Salaire',
    amount: 4400,
    currency: 'CHF',
    accountId: 'acc-1',
    memberId: null,
    frequency: 'monthly',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: null,
    active: true,
    createdAt: stamp,
    updatedAt: stamp,
    ...overrides,
  };
}

function tx(
  overrides: Partial<MatchableTransaction> = {}
): MatchableTransaction {
  return {
    id: 'tx-1',
    accountId: 'acc-1',
    date: '2026-11-25T12:00:00.000Z',
    amount: 4400,
    transferId: null,
    incomeId: null,
    budgetMonth: null,
    ...overrides,
  };
}

function ctx(overrides: Partial<IncomeLinkContext> = {}): IncomeLinkContext {
  return {
    income: income(),
    transaction: tx(),
    month: '2026-11',
    confirmedTransactionId: null,
    hasPayment: false,
    ...overrides,
  };
}

describe('checkIncomeLink', () => {
  it('allows a free positive transaction of the same account in the due month', () => {
    expect(checkIncomeLink(ctx())).toBeNull();
  });

  it('allows a transaction dated on the last day of the month', () => {
    const last = tx({ date: '2026-11-30T12:00:00.000Z' });
    expect(checkIncomeLink(ctx({ transaction: last }))).toBeNull();
  });

  it('refuses a debit or a zero amount', () => {
    expect(checkIncomeLink(ctx({ transaction: tx({ amount: -50 }) }))).toBe(
      'amount-not-positive'
    );
    expect(checkIncomeLink(ctx({ transaction: tx({ amount: 0 }) }))).toBe(
      'amount-not-positive'
    );
  });

  it('refuses a transfer leg', () => {
    expect(
      checkIncomeLink(ctx({ transaction: tx({ transferId: 'trf-1' }) }))
    ).toBe('transfer-leg');
  });

  it('refuses a transaction already linked to a source', () => {
    const linked = tx({ incomeId: 'inc-2', budgetMonth: '2026-11' });
    expect(checkIncomeLink(ctx({ transaction: linked }))).toBe(
      'already-linked'
    );
  });

  it('refuses a transaction already matched to a charge payment', () => {
    expect(checkIncomeLink(ctx({ hasPayment: true }))).toBe('payment-linked');
  });

  it('refuses another account than the source account', () => {
    expect(
      checkIncomeLink(ctx({ transaction: tx({ accountId: 'acc-2' }) }))
    ).toBe('account-mismatch');
  });

  it('refuses an inactive source', () => {
    expect(checkIncomeLink(ctx({ income: income({ active: false }) }))).toBe(
      'income-inactive'
    );
  });

  it('refuses a month where the source is not due', () => {
    const ended = income({ endDate: '2026-06-30T00:00:00.000Z' });
    expect(checkIncomeLink(ctx({ income: ended }))).toBe('income-not-due');
  });

  it('refuses a date outside the month to confirm', () => {
    const october = tx({ date: '2026-10-31T12:00:00.000Z' });
    expect(checkIncomeLink(ctx({ transaction: october }))).toBe(
      'date-outside-month'
    );
  });

  it('refuses a month already confirmed by another transaction', () => {
    expect(checkIncomeLink(ctx({ confirmedTransactionId: 'tx-9' }))).toBe(
      'month-already-confirmed'
    );
  });

  it('reports the first failing rule when several fail', () => {
    const bad = ctx({
      transaction: tx({ amount: -1, transferId: 'trf-1', accountId: 'acc-2' }),
      income: income({ active: false }),
    });
    expect(checkIncomeLink(bad)).toBe('amount-not-positive');
  });

  it('does not mutate its input', () => {
    const input = ctx();
    const copy = JSON.parse(JSON.stringify(input));
    checkIncomeLink(input);
    expect(input).toEqual(copy);
  });
});

describe('linkIncomeSchema', () => {
  it('accepts a transaction id and a month key', () => {
    expect(
      linkIncomeSchema.parse({ transactionId: 'tx-1', month: '2026-11' })
    ).toEqual({ transactionId: 'tx-1', month: '2026-11' });
  });

  it('rejects an empty transaction id and a malformed month', () => {
    expect(
      linkIncomeSchema.safeParse({ transactionId: '', month: '2026-11' })
        .success
    ).toBe(false);
    expect(
      linkIncomeSchema.safeParse({ transactionId: 'tx-1', month: '2026-13' })
        .success
    ).toBe(false);
    expect(linkIncomeSchema.safeParse({ transactionId: 'tx-1' }).success).toBe(
      false
    );
  });
});
