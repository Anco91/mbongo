/** Stub for 01-query-factories: the Executor replaces this file. */
export const memberQueries = {
  all: (): readonly ['members'] => {
    throw new Error('not implemented');
  },
  list: (): QueryStub => {
    throw new Error('not implemented');
  },
};

/** Minimal shape the locked tests read; the real factories return `queryOptions`. */
type QueryStub = { queryKey: readonly unknown[]; enabled?: boolean };
