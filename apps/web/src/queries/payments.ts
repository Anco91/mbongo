/** Stub for 02-query-factories-charges: the Executor replaces this file. */
import type { PaymentQuery } from '@mbongo/shared';

export const paymentQueries = {
  all: (): readonly ['payments'] => {
    throw new Error('not implemented');
  },
  list: (query?: PaymentQuery): QueryStub => {
    void query;
    throw new Error('not implemented');
  },
  detail: (id: string): QueryStub => {
    void id;
    throw new Error('not implemented');
  },
  byCharge: (chargeId: string): QueryStub => {
    void chargeId;
    throw new Error('not implemented');
  },
};

/** Minimal shape the locked tests read; the real factories return `queryOptions`. */
type QueryStub = { queryKey: readonly unknown[]; enabled?: boolean };
