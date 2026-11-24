/**
 * Locked tests for 01-query-factories: the query keys are the cache
 * contract. They must stay byte-identical to the keys the server guards
 * and pages prefetch with (`['accounts', {}]`, `['members']`, ...), or the
 * prefetched data is no longer reused by the hooks.
 *
 * @module Tests/Queries/QueryFactories
 */
import { accountQueries } from '@/queries/accounts';
import { memberQueries } from '@/queries/members';
import { transactionQueries } from '@/queries/transactions';
import { monthTransactionsQuery } from '@/lib/month-queries';

describe('memberQueries', () => {
  it('uses the bare "members" key shared with the household guard prefetch', () => {
    expect(memberQueries.list().queryKey).toEqual(['members']);
  });

  it('exposes the resource prefix used to invalidate every members query', () => {
    expect(memberQueries.all()).toEqual(['members']);
  });
});

describe('accountQueries', () => {
  it('keys the default list by an empty query, like the guards prefetch', () => {
    expect(accountQueries.list().queryKey).toEqual(['accounts', {}]);
  });

  it('keys a filtered list by its query object', () => {
    const query = { status: { eq: 'ACTIVE' } } as const;
    expect(accountQueries.list(query).queryKey).toEqual(['accounts', query]);
  });

  it('keys a detail by its id and is disabled while the id is empty', () => {
    expect(accountQueries.detail('acc1').queryKey).toEqual([
      'accounts',
      'acc1',
    ]);
    expect(accountQueries.detail('acc1').enabled).toBe(true);
    expect(accountQueries.detail('').enabled).toBe(false);
  });

  it('places every list and detail key under the resource prefix', () => {
    const prefix = accountQueries.all();
    expect(prefix).toEqual(['accounts']);
    expect(accountQueries.list().queryKey.slice(0, 1)).toEqual(prefix);
    expect(accountQueries.detail('acc1').queryKey.slice(0, 1)).toEqual(prefix);
  });
});

describe('transactionQueries', () => {
  it('keys the default list by an empty query, like the guards prefetch', () => {
    expect(transactionQueries.list().queryKey).toEqual(['transactions', {}]);
  });

  it('keys a month window by its typed query so the budget page prefetch is reused', () => {
    const query = monthTransactionsQuery('2026-11');
    expect(transactionQueries.list(query).queryKey).toEqual([
      'transactions',
      query,
    ]);
  });

  it('exposes the resource prefix used to invalidate every transactions query', () => {
    expect(transactionQueries.all()).toEqual(['transactions']);
  });
});
