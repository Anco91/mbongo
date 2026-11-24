/** Stub for 03-query-factories-rest: the Executor replaces this file. */
import type { TransferQuery } from '@mbongo/shared';

export const transferQueries = {
  all: (): readonly ['transfers'] => {
    throw new Error('not implemented');
  },
  list: (query?: TransferQuery): QueryStub => {
    void query;
    throw new Error('not implemented');
  },
};

/** Minimal shape the locked tests read; the real factories return `queryOptions`. */
type QueryStub = { queryKey: readonly unknown[] };
