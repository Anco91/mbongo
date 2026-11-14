/**
 * Tests for cardBilling — unified deferred-debit / credit-card billing.
 *
 * @module Tests/Domain/CardBilling
 * @jest-environment node
 */
import { cardBilling } from '@mbongo/shared';
import { Account, Transaction } from '@mbongo/shared';

// ============================================================================
// Fixtures
// ============================================================================

function makeAccount(overrides: Partial<Account>): Account {
  return {
    id: 'card-ubs-0001',
    name: 'Carte UBS',
    bank: 'UBS',
    currency: 'CHF',
    accountType: 'CREDIT_CARD',
    memberId: null,
    overdraftLimit: 0,
    deferredCard: false,
    billingDay: 28,
    linkedAccountId: null,
    openingBalance: 0,
    status: 'ACTIVE',
    closedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: `txn-${Math.random().toString(36).slice(2)}`,
    accountId: 'card-ubs-0001',
    date: '2026-11-10T00:00:00.000Z',
    amount: -100,
    category: null,
    note: null,
    transferId: null,
    transferRole: null,
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
    ...overrides,
  };
}

const TODAY = new Date('2026-11-15T12:00:00');

// ============================================================================
// Carte de crédit UBS — billingDay + compte courant lié
// ============================================================================

describe('cardBilling — carte de crédit (UBS)', () => {
  const ubsCard = makeAccount({
    accountType: 'CREDIT_CARD',
    billingDay: 28,
    linkedAccountId: 'courant-ubs-0001',
  });

  it('computes the encours since the last settlement and the next billing day', () => {
    const transactions = [
      makeTransaction({ date: '2026-10-29T00:00:00.000Z', amount: -300 }),
      // Settlement of the October invoice (credit on the card account)
      makeTransaction({ date: '2026-11-01T00:00:00.000Z', amount: 300 }),
      // November purchases (current cycle)
      makeTransaction({ date: '2026-11-05T00:00:00.000Z', amount: -400.2 }),
      makeTransaction({ date: '2026-11-12T00:00:00.000Z', amount: -240 }),
    ];

    const billing = cardBilling(ubsCard, transactions, TODAY);

    expect(billing.encours).toBe(640.2);
    expect(billing.nextBillingDate).toEqual(new Date('2026-11-28T00:00:00'));
    expect(billing.settlementAccountId).toBe('courant-ubs-0001');
  });

  it('ignores purchases from previous cycles (before the last settlement)', () => {
    const transactions = [
      makeTransaction({ date: '2026-10-20T00:00:00.000Z', amount: -999 }),
      makeTransaction({ date: '2026-11-01T00:00:00.000Z', amount: 999 }),
      makeTransaction({ date: '2026-11-10T00:00:00.000Z', amount: -50 }),
    ];

    expect(cardBilling(ubsCard, transactions, TODAY).encours).toBe(50);
  });

  it('returns a zero encours with no purchase in the cycle', () => {
    const transactions = [
      makeTransaction({ date: '2026-10-20T00:00:00.000Z', amount: -400 }),
      makeTransaction({ date: '2026-11-01T00:00:00.000Z', amount: 400 }),
    ];

    const billing = cardBilling(ubsCard, transactions, TODAY);
    expect(billing.encours).toBe(0);
    expect(billing.nextBillingDate).toEqual(new Date('2026-11-28T00:00:00'));
  });

  it('moves the billing day to the next month when it has passed', () => {
    const lateToday = new Date('2026-11-29T12:00:00');
    const transactions = [makeTransaction({ date: '2026-11-25T00:00:00.000Z', amount: -100 })];

    expect(cardBilling(ubsCard, transactions, lateToday).nextBillingDate).toEqual(
      new Date('2026-12-28T00:00:00')
    );
  });

  it('clamps the billing day to the length of the target month (31 → 28)', () => {
    const card31 = makeAccount({ billingDay: 31 });
    const febToday = new Date('2026-02-20T12:00:00');
    const transactions = [makeTransaction({ date: '2026-02-05T00:00:00.000Z', amount: -10 })];

    expect(cardBilling(card31, transactions, febToday).nextBillingDate).toEqual(
      new Date('2026-02-28T00:00:00')
    );
  });

  it('falls back to the card account itself when no settlement account is linked', () => {
    const orphanCard = makeAccount({ linkedAccountId: null });
    const transactions = [makeTransaction({ amount: -20 })];

    expect(cardBilling(orphanCard, transactions, TODAY).settlementAccountId).toBe(
      'card-ubs-0001'
    );
  });

  it('returns null nextBillingDate when the card has no billing day', () => {
    const noBillingDay = makeAccount({ billingDay: null });
    const transactions = [makeTransaction({ amount: -20 })];

    expect(cardBilling(noBillingDay, transactions, TODAY).nextBillingDate).toBeNull();
  });
});

// ============================================================================
// Débit différé BNP — cycle = mois civil, règlement = self
// ============================================================================

describe('cardBilling — débit différé (BNP)', () => {
  const bnpJoint = makeAccount({
    id: 'joint-bnp-0001',
    accountType: 'JOINT',
    deferredCard: true,
    linkedAccountId: null,
  });

  it('limits the cycle to the current calendar month and settles on itself', () => {
    const transactions = [
      makeTransaction({ accountId: 'joint-bnp-0001', date: '2026-10-20T00:00:00.000Z', amount: -999 }),
      makeTransaction({ accountId: 'joint-bnp-0001', date: '2026-11-03T00:00:00.000Z', amount: -150 }),
      makeTransaction({ accountId: 'joint-bnp-0001', date: '2026-11-14T00:00:00.000Z', amount: -270.5 }),
    ];

    const billing = cardBilling(bnpJoint, transactions, TODAY);

    expect(billing.encours).toBe(420.5);
    expect(billing.nextBillingDate).toEqual(new Date('2026-11-30T23:59:59.999'));
    expect(billing.settlementAccountId).toBe('joint-bnp-0001');
  });

  it('resets the cycle at the start of a new month without any settlement transaction', () => {
    const december = new Date('2026-12-02T12:00:00');
    const transactions = [
      makeTransaction({ accountId: 'joint-bnp-0001', date: '2026-11-10T00:00:00.000Z', amount: -420 }),
      makeTransaction({ accountId: 'joint-bnp-0001', date: '2026-12-01T00:00:00.000Z', amount: -60 }),
    ];

    const billing = cardBilling(bnpJoint, transactions, december);
    expect(billing.encours).toBe(60);
  });

  it('returns a zero encours with no purchase in the month', () => {
    const transactions = [
      makeTransaction({ accountId: 'joint-bnp-0001', date: '2026-10-20T00:00:00.000Z', amount: -999 }),
    ];

    expect(cardBilling(bnpJoint, transactions, TODAY).encours).toBe(0);
  });
});
