/**
 * Transaction query → Prisma find args (pure, testable without Prisma).
 *
 * Owns the where-translator field map and the stable keyset page:
 * order `date desc, id desc`, cursor row skipped.
 *
 * @module Server/Transactions/TransactionQuery
 */

import { NULL_FILTER_VALUE, type TransactionQuery } from '@mbongo/shared';
import type { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';
import { createWhereTranslator } from '@/server/common/where-translator';

const toDate = (v: unknown): unknown =>
  typeof v === 'string' ? parseISO(v) : v;

const toNumber = (v: unknown): unknown => {
  if (typeof v !== 'string' || v.trim() === '') return v;
  const n = Number(v);
  if (Number.isNaN(n)) throw new RangeError('Invalid numeric filter');
  return n;
};

/** `'null'` stand-in → real null; applied item by item on lists. */
const toNullable = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(toNullable);
  return v === NULL_FILTER_VALUE ? null : v;
};

const transactionWhereTranslator =
  createWhereTranslator<Prisma.TransactionWhereInput>({
    accountId: { ops: ['eq', 'in'] },
    category: { ops: ['eq', 'contains', 'in'] },
    transferId: { ops: ['eq', 'in'], transform: toNullable },
    incomeId: { ops: ['eq', 'in'], transform: toNullable },
    transferRole: { ops: ['eq', 'in'] },
    amount: {
      ops: ['eq', 'gt', 'gte', 'lt', 'lte'],
      transform: toNumber,
    },
    dateFrom: { ops: ['gte'], target: 'date', transform: toDate },
    dateTo: { ops: ['lte'], target: 'date', transform: toDate },
    date: { ops: ['eq', 'gte', 'lte', 'gt', 'lt'], transform: toDate },
  });

export interface TransactionFindArgs {
  where: Prisma.TransactionWhereInput;
  orderBy: [{ date: 'desc' }, { id: 'desc' }];
  take?: number;
  cursor?: { id: string };
  skip?: 1;
}

export function buildTransactionFindArgs(
  query: TransactionQuery
): TransactionFindArgs {
  return {
    where: transactionWhereTranslator(query as Record<string, unknown>),
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    take: query.limit,
    cursor: query.cursor ? { id: query.cursor } : undefined,
    skip: query.cursor ? 1 : undefined,
  };
}
