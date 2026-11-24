/**
 * Locked tests for 03-query-factories-rest: the query keys are the
 * cache contract. They must stay byte-identical to the keys the pages
 * and guards prefetch with (`['incomes', { month }]`,
 * `['monthly-budgets', month]`, `['transfers', query]`), or prefetched
 * data is no longer reused by the hooks.
 *
 * @module Tests/Queries/QueryFactoriesRest
 */
import { incomeQueries } from '@/queries/incomes';
import { transferQueries } from '@/queries/transfers';
import { monthlyBudgetQueries } from '@/queries/monthly-budgets';
import { exchangeRateQueries } from '@/queries/exchange-rate';

describe('incomeQueries', () => {
  it('keys the default list by an empty query', () => {
    expect(incomeQueries.list().queryKey).toEqual(['incomes', {}]);
  });

  it('keys a month list by its query object, like the budget page prefetch', () => {
    expect(incomeQueries.list({ month: '2026-11' }).queryKey).toEqual([
      'incomes',
      { month: '2026-11' },
    ]);
  });

  it('keys a detail by its id and is disabled while the id is empty', () => {
    expect(incomeQueries.detail('i1').queryKey).toEqual(['incomes', 'i1']);
    expect(incomeQueries.detail('i1').enabled).toBe(true);
    expect(incomeQueries.detail('').enabled).toBe(false);
  });

  it('exposes the resource prefix that invalidates every incomes query', () => {
    const prefix = incomeQueries.all();
    expect(prefix).toEqual(['incomes']);
    expect(incomeQueries.list().queryKey.slice(0, 1)).toEqual(prefix);
    expect(incomeQueries.detail('i1').queryKey.slice(0, 1)).toEqual(prefix);
  });
});

describe('transferQueries', () => {
  it('keys the default list by an empty query, like the dashboard guard prefetch', () => {
    expect(transferQueries.list().queryKey).toEqual(['transfers', {}]);
  });

  it('keys a filtered list by its query object', () => {
    const query = { status: { eq: 'ESTIMATED' } } as const;
    expect(transferQueries.list(query).queryKey).toEqual(['transfers', query]);
  });

  it('exposes the resource prefix that invalidates every transfers query', () => {
    const prefix = transferQueries.all();
    expect(prefix).toEqual(['transfers']);
    expect(transferQueries.list().queryKey.slice(0, 1)).toEqual(prefix);
  });
});

describe('monthlyBudgetQueries', () => {
  it('keys a month by its YYYY-MM string, like the budget page prefetch', () => {
    expect(monthlyBudgetQueries.detail('2026-11').queryKey).toEqual([
      'monthly-budgets',
      '2026-11',
    ]);
  });

  it('is disabled while the month is empty', () => {
    expect(monthlyBudgetQueries.detail('2026-11').enabled).toBe(true);
    expect(monthlyBudgetQueries.detail('').enabled).toBe(false);
  });

  it('exposes the resource prefix', () => {
    const prefix = monthlyBudgetQueries.all();
    expect(prefix).toEqual(['monthly-budgets']);
    expect(monthlyBudgetQueries.detail('2026-11').queryKey.slice(0, 1)).toEqual(
      prefix
    );
  });
});

describe('exchangeRateQueries', () => {
  it('keys the live rate as a single entry', () => {
    expect(exchangeRateQueries.latest().queryKey).toEqual(['exchange-rate']);
    expect(exchangeRateQueries.all()).toEqual(['exchange-rate']);
  });

  it('keeps the 12 h session cache and a single retry', () => {
    expect(exchangeRateQueries.latest().staleTime).toBe(12 * 60 * 60 * 1000);
    expect(exchangeRateQueries.latest().retry).toBe(1);
  });
});
