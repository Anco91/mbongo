/** Stub for 03-query-factories-rest: the Executor replaces this file. */

export const monthlyBudgetQueries = {
  all: (): readonly ['monthly-budgets'] => {
    throw new Error('not implemented');
  },
  detail: (month: string): QueryStub => {
    void month;
    throw new Error('not implemented');
  },
};

/** Minimal shape the locked tests read; the real factories return `queryOptions`. */
type QueryStub = { queryKey: readonly unknown[]; enabled?: boolean };
