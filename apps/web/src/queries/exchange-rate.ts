/** Stub for 03-query-factories-rest: the Executor replaces this file. */

export const exchangeRateQueries = {
  all: (): readonly ['exchange-rate'] => {
    throw new Error('not implemented');
  },
  latest: (): QueryStub => {
    throw new Error('not implemented');
  },
};

/** Minimal shape the locked tests read; the real factories return `queryOptions`. */
type QueryStub = {
  queryKey: readonly unknown[];
  staleTime?: number;
  retry?: number;
};
