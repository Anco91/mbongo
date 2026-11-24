/** Stub for 01-query-factories: the Executor replaces this file. */
import type { TransactionQuery } from '@mbongo/shared';

export const transactionQueries = {
  all: (): readonly ['transactions'] => {
    throw new Error('not implemented');
  },
  list: (query?: TransactionQuery): QueryStub => {
    void query;
    throw new Error('not implemented');
  },
};

/** Minimal shape the locked tests read; the real factories return `queryOptions`. */
type QueryStub = { queryKey: readonly unknown[]; enabled?: boolean };
