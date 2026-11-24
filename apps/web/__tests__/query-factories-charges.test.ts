/**
 * Locked tests for 02-query-factories-charges: the query keys are the
 * cache contract. They must stay byte-identical to the keys the server
 * guards and pages prefetch with (`['charges', {}]`, `['payments', q]`,
 * `['payments', id]`, `['charges', id]`), or prefetched data is no
 * longer reused by the hooks.
 *
 * @module Tests/Queries/QueryFactoriesCharges
 */
import { chargeQueries } from '@/queries/charges';
import { paymentQueries } from '@/queries/payments';
import { monthPaymentsQuery } from '@/lib/month-queries';

describe('chargeQueries', () => {
  it('keys the default list by an empty query, like the guards prefetch', () => {
    expect(chargeQueries.list().queryKey).toEqual(['charges', {}]);
  });

  it('keys a filtered list by its query object', () => {
    const query = { type: { eq: 'RECURRING' } } as const;
    expect(chargeQueries.list(query).queryKey).toEqual(['charges', query]);
  });

  it('keys a detail by its id and is disabled while the id is empty', () => {
    expect(chargeQueries.detail('ch1').queryKey).toEqual(['charges', 'ch1']);
    expect(chargeQueries.detail('ch1').enabled).toBe(true);
    expect(chargeQueries.detail('').enabled).toBe(false);
  });

  it('places every list and detail key under the resource prefix', () => {
    const prefix = chargeQueries.all();
    expect(prefix).toEqual(['charges']);
    expect(chargeQueries.list().queryKey.slice(0, 1)).toEqual(prefix);
    expect(chargeQueries.detail('ch1').queryKey.slice(0, 1)).toEqual(prefix);
  });
});

describe('paymentQueries', () => {
  it('keys the default list by an empty query', () => {
    expect(paymentQueries.list().queryKey).toEqual(['payments', {}]);
  });

  it('keys a month window by its typed query so the page and guard prefetch are reused', () => {
    const query = monthPaymentsQuery('2026-11');
    expect(paymentQueries.list(query).queryKey).toEqual(['payments', query]);
  });

  it('keys a detail by its id and is disabled while the id is empty', () => {
    expect(paymentQueries.detail('p1').queryKey).toEqual(['payments', 'p1']);
    expect(paymentQueries.detail('p1').enabled).toBe(true);
    expect(paymentQueries.detail('').enabled).toBe(false);
  });

  it('keys the payments of one charge by a chargeId object and disables it while the id is empty', () => {
    expect(paymentQueries.byCharge('ch1').queryKey).toEqual([
      'payments',
      { chargeId: 'ch1' },
    ]);
    expect(paymentQueries.byCharge('ch1').enabled).toBe(true);
    expect(paymentQueries.byCharge('').enabled).toBe(false);
  });

  it('exposes the resource prefix that invalidates every payments query, windows included', () => {
    const prefix = paymentQueries.all();
    expect(prefix).toEqual(['payments']);
    expect(paymentQueries.list().queryKey.slice(0, 1)).toEqual(prefix);
    expect(paymentQueries.detail('p1').queryKey.slice(0, 1)).toEqual(prefix);
    expect(paymentQueries.byCharge('ch1').queryKey.slice(0, 1)).toEqual(prefix);
  });
});
