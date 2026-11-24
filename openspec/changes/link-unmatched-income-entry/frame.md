---
id: link-unmatched-income-entry
status: draft
branch: feat/link-unmatched-income-entry
tier: small
locked_at:
locked_tests: []
---

# Frame — link-unmatched-income-entry

OpenSpec change `openspec/changes/link-unmatched-income-entry/`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5, FE-1..9.

## Frame

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/components/dashboard/unmatched-income-banner.tsx` | client banner | `export function UnmatchedIncomeBanner(): JSX.Element \| null` — null when no item or while loading |

### Modify

| Path | Change |
|---|---|
| `apps/web/src/components/dashboard/dashboard-content.tsx` | render `<UnmatchedIncomeBanner />` above the cards |
| `docs/LEXIQUE.md` | row « N revenus à lier » |
| `specs/current/income-management/spec.md` | Advisor only, at review (SPEC-2/3) |

### Read (allow-list)

- `ARCHITECTURE.md`, `docs/LEXIQUE.md`
- `apps/web/src/hooks/use-incomes.ts`, `components/dashboard/dashboard-content.tsx`, `components/ui/button.tsx`

### Reuse (from the registry)

- `useUnmatchedIncome` — count = `items.length`.

### Style exemplars

- `apps/web/src/components/patterns/show-closed-toggle.tsx` — small dashboard-level control.

### Libraries

- next `Link`. None new.

### Forbidden

- Any file not listed. New API, query, schema. Recomputing « unmatched » in the banner.

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
