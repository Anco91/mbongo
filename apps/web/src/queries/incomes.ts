/** Stub for 03-query-factories-rest: the Executor replaces this file. */
import type { IncomeQuery } from '@mbongo/shared';

export const incomeQueries = {
  all: (): readonly ['incomes'] => {
    throw new Error('not implemented');
  },
  list: (query?: IncomeQuery): QueryStub => {
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
