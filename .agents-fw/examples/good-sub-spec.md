---
id: 03-charges-period-filter
status: review
branch: feat/03-charges-period-filter
locked_at: 9b7e3d2
locked_tests:
  - packages/shared/src/domain/period.test.ts
  - packages/shared/src/filter/to-prisma-args.test.ts
  - packages/shared/src/schemas/period.test.ts
---

# 03 — Filter charges by period

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5

## Goal

On the charges list, the user picks a period (this month, last month, custom range) and sees only
charges due in it. The period is kept in the URL.

## Acceptance criteria

1. Given charges due on 2026-10-31 and 2026-11-01, when "November 2026" is picked, only the second shows.
2. Given a custom range, `from` after `to` is rejected with a field error.
3. Reloading the page keeps the selected period (URL state).

## Frame

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `packages/shared/src/domain/period.ts` | pure domain fn | `periodToRange(period: Period, today: Date): { gte: Date; lte: Date }` |
| `packages/shared/src/schemas/period.ts` | schema | `periodSchema` (`month` \| `lastMonth` \| `custom {from,to}`), `type Period` |
| `apps/web/src/components/charges/charges-period-filter.tsx` | client component | `ChargesPeriodFilter()` (nuqs `useQueryStates`) |

### Modify

| Path | Change |
|---|---|
| `apps/web/src/components/charges/charges-view.tsx` | read period from search params, pass `where.dueDate` from `periodToRange` |
| `apps/web/src/components/charges/charges-content.tsx` | render `ChargesPeriodFilter` in `ListView filters` |

### Read (allow-list)

- `ARCHITECTURE.md`, `packages/shared/src/schemas/charge.ts`, `apps/web/src/components/charges/charges-view.tsx`

### Reuse (from the registry)

- `packages/shared/src/filter/list-query.schema.ts` — `dueDate` already filterable with `gte/lte`.
- `apps/web/src/components/patterns/list-view.tsx` — `filters` slot.

### Libraries

- date-fns — `startOfMonth`, `endOfMonth`, `subMonths`. nuqs — URL state.

### Forbidden

- Any other file. Editing locked tests. Native `Date` arithmetic. `useEffect`. A new filter operator.
- Standard to read: `frontend.md > FE-4`, `reference/frontend.md > View and Content`.

## Tests

### Locked (written by the Advisor, failing before execution)

- `packages/shared/src/domain/period.test.ts` — month ends, leap year, custom range order.
- `packages/shared/src/filter/to-prisma-args.test.ts` — `dueDate` range becomes `{ gte, lte }`.

Proof of failure: `pnpm vitest run packages/shared` → `7 failed (periodToRange is not implemented)`

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|
| `packages/shared/src/schemas/period.test.ts` | `from > to` rejected | accepted |

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|
| `period.test.ts` "last month on Jan 1st" | expected Dec of the same year | previous year | accepted, Advisor fixed and re-locked |

## Out of scope

- Saved periods. Filtering other lists.

## Handoffs

- `docs/handoffs/20261123-1012-03-charges-period-filter.md`
- `docs/handoffs/20261123-1540-03-charges-period-filter.md`
