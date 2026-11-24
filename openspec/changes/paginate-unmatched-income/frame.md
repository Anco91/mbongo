---
id: paginate-unmatched-income
status: ready
branch: feat/paginate-unmatched-income
tier: medium
locked_at: ee4af6f
locked_tests:
  - apps/web/__tests__/transaction-page-args.test.ts
---

# Frame — paginate-unmatched-income

OpenSpec change `openspec/changes/paginate-unmatched-income/`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5, FE-1..9. Needs spec 18 (done).

## Frame

### Create

| Path | Signature |
|---|---|
| `apps/web/src/server/transactions/transaction-query.ts` | `buildTransactionFindArgs(query: TransactionQuery): { where; orderBy: [{date:'desc'},{id:'desc'}]; take?; cursor?: {id}; skip?: 1 }` — owns the where-translator field map moved out of the service; adds `amount` (ops eq/gt/gte/lt/lte, numeric transform) and `incomeId` (eq/in) and makes `transferId` eq accept `'null'` → `null` |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/schemas/transaction.ts` | `transactionQuerySchema` gains `amount` and `incomeId` (`filterSchema.optional()`); export `NULL_FILTER_VALUE = 'null'` (HTTP cannot carry null) |
| `apps/web/src/server/transactions/transaction.service.ts` | `findMany` uses `buildTransactionFindArgs` (stable order, cursor + skip 1) |
| `apps/web/src/queries/transactions.ts` | add infinite-query factory for unmatched income pages (filter + cursor) |
| `apps/web/src/hooks/use-incomes.ts` | `useUnmatchedIncome` over `useInfiniteQuery`; returns `hasNextPage`, `fetchNextPage`, `isFetchingNextPage` |
| `apps/web/src/lib/month-queries.ts` | replace `UNMATCHED_QUERY` by `UNMATCHED_PAGE_SIZE = 50` and `unmatchedIncomeQuery(cursor?)` (amount gt 0, incomeId/transferId eq NULL_FILTER_VALUE) |
| `apps/web/src/components/patterns/prefetch-guard.tsx` | only if needed: generic support of an infinite entry |
| `apps/web/src/components/incomes/unmatched-income-guard.tsx` | prefetch first page |
| `apps/web/src/components/incomes/unmatched-income-content.tsx` | « Afficher plus » button |
| `docs/LEXIQUE.md` | row « Afficher plus » if absent |
| `specs/current/income-management/spec.md` | Advisor only, at review (SPEC-2/3) |

### Read (allow-list)

- `ARCHITECTURE.md`, `docs/LEXIQUE.md`
- `apps/web/src/queries/transactions.ts`, `hooks/use-incomes.ts`, `lib/month-queries.ts`
- `apps/web/src/server/transactions/transaction.service.ts`, `server/common/where-translator.ts`, `packages/shared/src/schemas/filter.ts`, `components/patterns/prefetch-guard.tsx`
- `apps/web/src/components/incomes/unmatched-income-*.tsx`

### Reuse (from the registry)

- `transactionQueries`, cursor in `transaction.service.findMany`, `findUnmatchedIncome`, `Button`.

### Style exemplars

- `apps/web/src/queries/transactions.ts` — factory shape.

### Libraries

- TanStack Query `useInfiniteQuery`. None new.

### Forbidden

- Any file not listed. No Prisma schema change. Do not touch `lib/api.ts`.

## Tests

### Locked

- `apps/web/__tests__/transaction-page-args.test.ts` (pure translator/page args + schema). UI glue stays untested (TEST-2).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Handoffs
