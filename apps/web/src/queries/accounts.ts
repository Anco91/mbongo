/** Stub for 01-query-factories: the Executor replaces this file. */
import type { AccountQuery } from '@mbongo/shared';

export const accountQueries = {
  all: (): readonly ['accounts'] => {
    throw new Error('not implemented');
  },
  list: (query?: AccountQuery): QueryStub => {
    void query;
    throw new Error('not implemented');
  },
  detail: (id: string): QueryStub => {
    void id;
    throw new Error('not implemented');
  },
};

/** Minimal shape the locked tests read; the real factories return `queryOptions`. */
type QueryStub = { queryKey: readonly unknown[]; enabled?: boolean };
