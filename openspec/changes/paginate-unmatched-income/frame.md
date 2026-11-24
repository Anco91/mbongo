---
id: paginate-unmatched-income
status: draft
branch: feat/paginate-unmatched-income
tier: medium
locked_at:
locked_tests: []
---

# Frame — paginate-unmatched-income

OpenSpec change `openspec/changes/paginate-unmatched-income/`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5, FE-1..9. Needs spec 18 (done).

## Frame

### Create

None.

### Modify

| Path | Change |
|---|---|
| `apps/web/src/queries/transactions.ts` | add infinite-query factory for unmatched income pages (filter + cursor) |
| `apps/web/src/hooks/use-incomes.ts` | `useUnmatchedIncome` over `useInfiniteQuery`; returns `hasNextPage`, `fetchNextPage`, `isFetchingNextPage` |
| `apps/web/src/lib/month-queries.ts` | replace `UNMATCHED_QUERY` by page size + filter constants |
| `apps/web/src/components/incomes/unmatched-income-guard.tsx` | prefetch first page |
| `apps/web/src/components/incomes/unmatched-income-content.tsx` | « Afficher plus » button |
| `docs/LEXIQUE.md` | row « Afficher plus » if absent |
| `specs/current/income-management/spec.md` | Advisor only, at review (SPEC-2/3) |

### Read (allow-list)

- `ARCHITECTURE.md`, `docs/LEXIQUE.md`
- `apps/web/src/queries/transactions.ts`, `hooks/use-incomes.ts`, `lib/month-queries.ts`
- `apps/web/src/server/transactions/transaction.service.ts`, `server/common/where-translator.ts`, `packages/shared/src/schemas/filter.ts` (read only)
- `apps/web/src/components/incomes/unmatched-income-*.tsx`

### Reuse (from the registry)

- `transactionQueries`, cursor in `transaction.service.findMany`, `findUnmatchedIncome`, `Button`.

### Style exemplars

- `apps/web/src/queries/transactions.ts` — factory shape.

### Libraries

- TanStack Query `useInfiniteQuery`. None new.

### Forbidden

- Any file not listed. Server or schema change: if the filter cannot express the unmatched condition, stop and ask (file outside Frame).

## Tests

### Locked

None (TEST-2: UI glue).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Handoffs
