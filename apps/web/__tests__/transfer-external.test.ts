/**
 * Locked tests for spec 37: a transfer to an account outside the household
 * has a SOURCE leg only (no target account, no rate, no fee). The pure rules,
 * the create schema and the account-scoped chart inputs must accept it.
 *
 * @module Tests/Transfers/External
 */
import {
  checkExternalTransferSource,
  checkTransferLegs,
  createTransferSchema,
  excludeClosedAccounts,
  isExternalTransfer,
  scopeToMember,
} from '@mbongo/shared';
import type { AccountScopedData } from '@mbongo/shared';

const external = {
  sourceAccountId: 'src',
  targetAccountId: null,
  externalLabel: 'Carla Elongo Pamba',
  amountSent: 1300,
  rateEstimated: 1,
  rateDate: '2026-11-03',
  sentAt: '2026-11-03',
  memo: 'CHARGES MAISON',
};

describe('isExternalTransfer', () => {
  it('is true without a target account', () => {
    expect(isExternalTransfer({ targetAccountId: null })).toBe(true);
  });

  it('is false with a target account', () => {
    expect(isExternalTransfer({ targetAccountId: 'tgt' })).toBe(false);
  });
});

describe('checkExternalTransferSource', () => {
  it('allows an active source account', () => {
    expect(
      checkExternalTransferSource({
        id: 'src',
        currency: 'EUR',
        status: 'ACTIVE',
      })
    ).toBeNull();
  });

  it('refuses a closed source account', () => {
    expect(
      checkExternalTransferSource({
        id: 'src',
        currency: 'EUR',
        status: 'CLOSED',
      })
    ).toBe('Source account is closed');
  });
});

describe('createTransferSchema, external transfer', () => {
  it('accepts a null target with an external label', () => {
    expect(createTransferSchema.safeParse(external).success).toBe(true);
  });

  it('rejects a null target without an external label', () => {
    const result = createTransferSchema.safeParse({
      ...external,
      externalLabel: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a blank external label', () => {
    const result = createTransferSchema.safeParse({
      ...external,
      externalLabel: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a target account together with an external label', () => {
    const result = createTransferSchema.safeParse({
      ...external,
      targetAccountId: 'tgt',
    });
    expect(result.success).toBe(false);
  });

  it('keeps an internal transfer valid without an external label', () => {
    const { externalLabel: _label, ...internal } = external;
    const result = createTransferSchema.safeParse({
      ...internal,
      targetAccountId: 'tgt',
    });
    expect(result.success).toBe(true);
  });
});

describe('checkTransferLegs, external transfer', () => {
  const record = {
    sourceAccountId: 'src',
    targetAccountId: null,
    amountSent: 1300,
    rateEstimated: 1,
    amountReceived: null,
    fees: null,
    status: 'COMPLETED' as const,
  };
  const sourceLeg = {
    accountId: 'src',
    transferRole: 'SOURCE' as const,
    amount: -1300,
  };

  it('accepts a completed external transfer with its source leg only', () => {
    expect(checkTransferLegs(record, [sourceLeg])).toEqual([]);
  });

  it('flags a missing source leg', () => {
    expect(checkTransferLegs(record, [])).toEqual(['SOURCE_MISSING']);
  });

  it('flags a target leg that must not exist', () => {
    const target = {
      accountId: 'tgt',
      transferRole: 'TARGET' as const,
      amount: 1300,
    };
    expect(checkTransferLegs(record, [sourceLeg, target])).toContain(
      'TARGET_UNEXPECTED'
    );
  });
});

describe('account-scoped chart inputs, external transfer', () => {
  const acc = (id: string, memberId: string | null, status = 'ACTIVE') =>
    ({ id, memberId, status, name: id }) as unknown;
  const data = {
    accounts: [acc('a1', 'm1'), acc('a2', 'm2'), acc('x', 'm1', 'CLOSED')],
    transactions: [],
    transfers: [
      { id: 'e1', sourceAccountId: 'a1', targetAccountId: null },
      { id: 'e2', sourceAccountId: 'a2', targetAccountId: null },
      { id: 'e3', sourceAccountId: 'x', targetAccountId: null },
    ],
    charges: [],
    payments: [],
  } as unknown as AccountScopedData;
  const ids = (rows: Array<{ id: string }>): string[] => rows.map((r) => r.id);

  it('scopeToMember keeps an external transfer whose source is in scope', () => {
    expect(ids(scopeToMember(data, 'm1').transfers)).toEqual(['e1', 'e3']);
  });

  it('scopeToMember narrowed to one account keeps only its external transfers', () => {
    expect(ids(scopeToMember(data, 'm1', 'a1').transfers)).toEqual(['e1']);
  });

  it('excludeClosedAccounts drops an external transfer from a closed source', () => {
    expect(ids(excludeClosedAccounts(data).transfers)).toEqual(['e1', 'e2']);
  });
});
