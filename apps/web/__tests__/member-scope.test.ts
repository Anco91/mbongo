/**
 * Locked tests for 25-member-scope-donut-sankey: a member scope keeps only
 * that member's accounts and what points at them; null keeps the household.
 *
 * @module Tests/Calculation/MemberScope
 */
import { scopeToMember } from '@mbongo/shared';
import type { AccountScopedData } from '@mbongo/shared';

const acc = (id: string, memberId: string | null): unknown => ({
  id,
  memberId,
  name: id,
});

const data = {
  accounts: [
    acc('a1', 'm1'),
    acc('a2', 'm2'),
    acc('joint', null),
    acc('a3', 'm1'),
  ],
  transactions: [
    { id: 't1', accountId: 'a1' },
    { id: 't2', accountId: 'a2' },
    { id: 't3', accountId: 'joint' },
  ],
  transfers: [
    { id: 'x1', sourceAccountId: 'a1', targetAccountId: 'a3' },
    { id: 'x2', sourceAccountId: 'a1', targetAccountId: 'joint' },
    { id: 'x3', sourceAccountId: 'a2', targetAccountId: 'joint' },
  ],
  charges: [
    { id: 'c1', accountId: 'a1' },
    { id: 'c2', accountId: 'a2' },
    { id: 'c3', accountId: 'joint' },
  ],
  payments: [
    { id: 'p1', chargeId: 'c1' },
    { id: 'p2', chargeId: 'c2' },
    { id: 'p3', chargeId: 'c3' },
  ],
  incomes: [
    { id: 'i1', accountId: 'a1' },
    { id: 'i2', accountId: 'a2' },
  ],
} as unknown as AccountScopedData;

const ids = (rows: Array<{ id: string }>): string[] => rows.map((r) => r.id);

describe('scopeToMember', () => {
  it('keeps the whole household when no member is selected', () => {
    expect(scopeToMember(data, null)).toEqual(data);
  });

  it('keeps only the member accounts and what points at them', () => {
    const scoped = scopeToMember(data, 'm1');

    expect(ids(scoped.accounts)).toEqual(['a1', 'a3']);
    expect(ids(scoped.transactions)).toEqual(['t1']);
    expect(ids(scoped.charges)).toEqual(['c1']);
    expect(ids(scoped.payments)).toEqual(['p1']);
    expect(ids(scoped.incomes ?? [])).toEqual(['i1']);
  });

  it('keeps a transfer only when both ends belong to the member', () => {
    expect(ids(scopeToMember(data, 'm1').transfers)).toEqual(['x1']);
  });

  it('excludes joint-account expenses from every member scope', () => {
    expect(ids(scopeToMember(data, 'm2').charges)).toEqual(['c2']);
  });

  it('returns empty collections for a member without accounts', () => {
    const scoped = scopeToMember(data, 'nobody');

    expect(scoped.accounts).toEqual([]);
    expect(scoped.transactions).toEqual([]);
    expect(scoped.payments).toEqual([]);
  });

  it('does not mutate its input', () => {
    const before = JSON.stringify(data);
    scopeToMember(data, 'm1');
    expect(JSON.stringify(data)).toBe(before);
  });
});
