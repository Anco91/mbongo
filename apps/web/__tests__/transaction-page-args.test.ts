/**
 * Locked tests for paginate-unmatched-income: the transaction query
 * becomes Prisma find args with amount/incomeId filters and a stable
 * keyset page (date desc, id desc, cursor with skip 1).
 *
 * @module Tests/Transactions/PageArgs
 */
import { transactionQuerySchema } from '@mbongo/shared';
import { buildTransactionFindArgs } from '@/server/transactions/transaction-query';

describe('buildTransactionFindArgs', () => {
  it('orders by date then id, both descending, for a stable cursor', () => {
    expect(buildTransactionFindArgs({}).orderBy).toEqual([
      { date: 'desc' },
      { id: 'desc' },
    ]);
  });

  it('has no cursor and skips nothing on the first page', () => {
    const args = buildTransactionFindArgs({ limit: 50 });
    expect(args.take).toBe(50);
    expect(args.cursor).toBeUndefined();
    expect(args.skip).toBeUndefined();
  });

  it('starts after the cursor row (skip 1)', () => {
    const args = buildTransactionFindArgs({ limit: 50, cursor: 'tx-9' });
    expect(args.cursor).toEqual({ id: 'tx-9' });
    expect(args.skip).toBe(1);
  });

  it('translates amount > 0 with a numeric operand, also from a query string', () => {
    expect(buildTransactionFindArgs({ amount: { gt: 0 } }).where).toEqual({
      amount: { gt: 0 },
    });
    expect(buildTransactionFindArgs({ amount: { gt: '0' } }).where).toEqual({
      amount: { gt: 0 },
    });
  });

  it('turns the "null" stand-in into a real null on incomeId and transferId', () => {
    expect(
      buildTransactionFindArgs({
        incomeId: { eq: 'null' },
        transferId: { eq: 'null' },
      }).where
    ).toEqual({
      incomeId: { equals: null },
      transferId: { equals: null },
    });
  });

  it('keeps a real income id untouched', () => {
    expect(
      buildTransactionFindArgs({ incomeId: { eq: 'inc-1' } }).where
    ).toEqual({ incomeId: { equals: 'inc-1' } });
  });
});

describe('transactionQuerySchema', () => {
  it('accepts amount and incomeId filters', () => {
    const parsed = transactionQuerySchema.parse({
      amount: { gt: '0' },
      incomeId: { eq: 'null' },
    });
    expect(parsed.amount).toEqual({ gt: '0' });
    expect(parsed.incomeId).toEqual({ eq: 'null' });
  });
});
