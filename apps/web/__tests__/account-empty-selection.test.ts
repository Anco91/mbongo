/**
 * Account forms send '' for « Foyer (commun) » and « no settlement account ».
 * The shared schemas must read '' as « none » (null), not refuse it.
 *
 * @module Tests/Schemas/AccountEmptySelection
 * @jest-environment node
 */
import { createAccountSchema, updateAccountSchema } from '@mbongo/shared';

const base = {
  name: 'Compte joint',
  currency: 'EUR' as const,
  accountType: 'JOINT' as const,
};

describe('account owner « Foyer (commun) »', () => {
  it('update: reads an empty memberId as null', () => {
    const result = updateAccountSchema.parse({ memberId: '' });
    expect(result.memberId).toBeNull();
  });

  it('create: reads an empty memberId as null', () => {
    const result = createAccountSchema.parse({ ...base, memberId: '' });
    expect(result.memberId).toBeNull();
  });

  it('keeps a real member id', () => {
    const result = updateAccountSchema.parse({ memberId: 'member-anco-0001' });
    expect(result.memberId).toBe('member-anco-0001');
  });
});

describe('empty settlement account', () => {
  it('credit card with empty linkedAccountId gets the settlement-account message', () => {
    const result = createAccountSchema.safeParse({
      ...base,
      accountType: 'CREDIT_CARD',
      linkedAccountId: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/settlement account/);
    }
  });

  it('non-card account with empty linkedAccountId is accepted as null', () => {
    const result = createAccountSchema.parse({ ...base, linkedAccountId: '' });
    expect(result.linkedAccountId).toBeNull();
  });
});
