/** Stub for 02-query-factories-charges: the Executor replaces this file. */
import type { ChargeQuery } from '@mbongo/shared';

export const chargeQueries = {
  all: (): readonly ['charges'] => {
    throw new Error('not implemented');
  },
  list: (query?: ChargeQuery): QueryStub => {
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
