/**
 * Tests for the transfer create form schema.
 *
 * The form extends the shared createTransferSchema with the account rules
 * (any pair, open accounts only) enforced client-side before any request.
 *
 * @module Tests/Transfers/TransferCreateFormSchema
 */
import { buildTransferFormSchema } from '@/components/transfers/transfer-create-form';
import type { Account } from '@mbongo/shared';

const now = '2026-11-12T00:00:00.000Z';

const account = (id: string, currency: 'CHF' | 'EUR'): Account => ({
  id,
  name: id,
  bank: null,
  currency,
  accountType: 'CURRENT',
  memberId: null,
  overdraftLimit: 0,
  deferredCard: false,
  billingDay: null,
  linkedAccountId: null,
  openingBalance: 0,
  status: 'ACTIVE',
  closedAt: null,
  createdAt: now,
  updatedAt: now,
});

const accounts = [
  account('account-ubs-courant', 'CHF'),
  account('account-bnp-perso', 'EUR'),
];

const validInput = {
  sourceAccountId: 'account-ubs-courant',
  targetAccountId: 'account-bnp-perso',
  amountSent: 1500,
  rateEstimated: 1.0634,
  rateDate: '2026-11-12',
  sentAt: '2026-11-12',
  memo: null,
};

describe('buildTransferFormSchema', () => {
  it('accepts a CHF source and an EUR target', () => {
    const result = buildTransferFormSchema(accounts).safeParse(validInput);

    expect(result.success).toBe(true);
  });

  it('accepts an EUR source and a CHF target (any pair of accounts)', () => {
    const result = buildTransferFormSchema(accounts).safeParse({
      ...validInput,
      sourceAccountId: 'account-bnp-perso',
      targetAccountId: 'account-ubs-courant',
    });

    expect(result.success).toBe(true);
  });

  it('accepts two accounts of the same currency', () => {
    const result = buildTransferFormSchema([
      ...accounts,
      account('account-ubs-epargne', 'CHF'),
    ]).safeParse({
      ...validInput,
      targetAccountId: 'account-ubs-epargne',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a closed source or target before sending', () => {
    const closed = (id: string): Account => ({
      ...account(id, 'CHF'),
      status: 'CLOSED',
    });
    const closedSource = buildTransferFormSchema([
      closed('account-ubs-courant'),
      accounts[1],
    ]).safeParse(validInput);
    const closedTarget = buildTransferFormSchema([
      accounts[0],
      { ...closed('account-bnp-perso'), currency: 'EUR' },
    ]).safeParse(validInput);

    expect(closedSource.success).toBe(false);
    expect(closedTarget.success).toBe(false);
    if (!closedSource.success && !closedTarget.success) {
      expect(closedSource.error.issues.map((i) => i.message)).toContain(
        'Le compte source est clôturé'
      );
      expect(closedTarget.error.issues.map((i) => i.message)).toContain(
        'Le compte cible est clôturé'
      );
    }
  });

  it('rejects source === target (shared schema rule)', () => {
    const result = buildTransferFormSchema(accounts).safeParse({
      ...validInput,
      targetAccountId: 'account-ubs-courant',
      sourceAccountId: 'account-ubs-courant',
    });

    expect(result.success).toBe(false);
  });
});
