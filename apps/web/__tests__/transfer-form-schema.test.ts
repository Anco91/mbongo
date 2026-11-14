/**
 * Tests for the transfer create form schema.
 *
 * The form extends the shared createTransferSchema with the currency
 * rule (source CHF, target EUR) enforced client-side — an EUR source or
 * CHF target must be rejected by zod before any request is sent.
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

  it('rejects an EUR source before sending (zod, no request)', () => {
    const result = buildTransferFormSchema(accounts).safeParse({
      ...validInput,
      sourceAccountId: 'account-bnp-perso',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain('Le compte source doit être en CHF');
    }
  });

  it('rejects a CHF target before sending (zod, no request)', () => {
    const result = buildTransferFormSchema(accounts).safeParse({
      ...validInput,
      targetAccountId: 'account-ubs-courant',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain('Le compte cible doit être en EUR');
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
