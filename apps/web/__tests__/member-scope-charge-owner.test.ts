/**
 * Locked tests for charge-owner-scope: member scope attributes charges by
 * owner, and an optional account restricts the scope further.
 *
 * @module Tests/Calculation/MemberScopeChargeOwner
 */
import { scopeToMember } from '@mbongo/shared';
import type { AccountScopedData } from '@mbongo/shared';

const data = {
  accounts: [
    { id: 'a1', memberId: 'm1' },
    { id: 'a2', memberId: 'm2' },
    { id: 'a3', memberId: 'm1' },
    { id: 'joint', memberId: null },
  ],
  transactions: [
    { id: 't1', accountId: 'a1' },
    { id: 't3', accountId: 'a3' },
  ],
  transfers: [{ id: 'x1', sourceAccountId: 'a1', targetAccountId: 'a3' }],
  charges: [
    { id: 'own-a1', accountId: 'a1' },
    { id: 'shared-a1', accountId: 'a1', shared: true },
    { id: 'm1-on-joint', accountId: 'joint', memberId: 'm1' },
    { id: 'm1-on-a2', accountId: 'a2', memberId: 'm1' },
    { id: 'own-a2', accountId: 'a2' },
    { id: 'own-a3', accountId: 'a3' },
    { id: 'plain-joint', accountId: 'joint' },
  ],
  payments: [
    { id: 'p-own-a1', chargeId: 'own-a1' },
    { id: 'p-shared', chargeId: 'shared-a1' },
    { id: 'p-joint', chargeId: 'm1-on-joint' },
    { id: 'p-a3', chargeId: 'own-a3' },
  ],
  incomes: [{ id: 'i1', accountId: 'a1' }],
} as unknown as AccountScopedData;

const ids = (rows: Array<{ id: string }>): string[] => rows.map((r) => r.id);

describe('scopeToMember — charge owner', () => {
  it('drops a common charge from a member scope', () => {
    expect(ids(scopeToMember(data, 'm1').charges)).not.toContain('shared-a1');
    expect(ids(scopeToMember(data, 'm1').payments)).not.toContain('p-shared');
  });

  it('keeps a common charge under the household', () => {
    expect(ids(scopeToMember(data, null).charges)).toContain('shared-a1');
  });

  it('counts a member charge debited from a joint account', () => {
    const scoped = scopeToMember(data, 'm1');

    expect(ids(scoped.charges)).toContain('m1-on-joint');
    expect(ids(scoped.payments)).toContain('p-joint');
  });

  it('counts a member charge debited from another member account', () => {
    expect(ids(scopeToMember(data, 'm1').charges)).toContain('m1-on-a2');
    expect(ids(scopeToMember(data, 'm2').charges)).toEqual(['own-a2']);
  });

  it('keeps charges following the account of the member', () => {
    expect(ids(scopeToMember(data, 'm1').charges)).toEqual([
      'own-a1',
      'm1-on-joint',
      'm1-on-a2',
      'own-a3',
    ]);
  });

  it('keeps accounts, transactions and incomes attributed by account', () => {
    const scoped = scopeToMember(data, 'm1');

    expect(ids(scoped.accounts)).toEqual(['a1', 'a3']);
    expect(ids(scoped.transactions)).toEqual(['t1', 't3']);
    expect(ids(scoped.incomes ?? [])).toEqual(['i1']);
  });
});

describe('scopeToMember — account sub-scope', () => {
  it('restricts accounts, transactions, incomes and transfers to one account', () => {
    const scoped = scopeToMember(data, 'm1', 'a1');

    expect(ids(scoped.accounts)).toEqual(['a1']);
    expect(ids(scoped.transactions)).toEqual(['t1']);
    expect(ids(scoped.incomes ?? [])).toEqual(['i1']);
    expect(scoped.transfers).toEqual([]);
  });

  it('keeps only the charges debited from that account', () => {
    const scoped = scopeToMember(data, 'm1', 'a1');

    expect(ids(scoped.charges)).toEqual(['own-a1']);
    expect(ids(scoped.payments)).toEqual(['p-own-a1']);
  });

  it('drops a member charge paid from another account', () => {
    expect(ids(scopeToMember(data, 'm1', 'a3').charges)).toEqual(['own-a3']);
  });

  it('returns nothing when the account is not the member one', () => {
    const scoped = scopeToMember(data, 'm1', 'a2');

    expect(scoped.accounts).toEqual([]);
    expect(scoped.charges).toEqual([]);
    expect(scoped.payments).toEqual([]);
  });

  it('ignores the account when no member is selected', () => {
    expect(scopeToMember(data, null, 'a1')).toEqual(data);
  });

  it('treats a null account as no sub-scope', () => {
    expect(scopeToMember(data, 'm1', null)).toEqual(scopeToMember(data, 'm1'));
  });
});
