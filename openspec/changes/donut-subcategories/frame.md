---
id: donut-subcategories
status: ready
branch: feat/donut-subcategories
tier: medium
locked_at: b9228be
locked_tests:
  - apps/web/__tests__/donut-subcategories.test.ts
---

# Frame — donut-subcategories

OpenSpec change `openspec/changes/donut-subcategories/`: goal in `proposal.md`, acceptance criteria in
`specs/*/spec.md`, checklist in `tasks.md`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5. Master row 10b.

## Summary

Le donut garde un segment par catégorie mais la légende plein écran détaille, sous chaque catégorie, ses sous-catégories (« Mobile 30 € », « Autres 20 € »). Le calcul est pur et testé; prévu et réalisé fusionnent. La carte et le Sankey ne changent pas.

## Frame

### Create

None.

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/lib/calculation/donut.ts` | `computeDonutExpenses`: per `(category, planned)` key also accumulate per sub-category `{eur, chf}` — a charge payment uses `charge.subcategory`, a transaction or a charge without one uses `OTHER_SUBCATEGORY`. At output, when the segment has at least one non-`OTHER` entry, set `subcategories = [{ name, value: round2(eur + counterValue(chf, rate)) }]` sorted by `value` desc (entries with value ≤ 0 dropped); otherwise leave the key absent. Replace the `mergeCategorySegments` stub: group by `name` in order of first appearance, sum `value`, merge `subcategories` by name (sum, sorted desc, absent when no segment has one), drop `planned`, never mutate input. Keep `SubcategoryExpense`, `OTHER_SUBCATEGORY`, `CategoryExpense.subcategories` as stubbed |
| `apps/web/src/components/charts/donut-categories-chart.tsx` | `DonutDatum.subcategories?: SubcategoryExpense[]`; delete local `mergeLegendRows`, use `mergeCategorySegments` in `DonutLegend`; render sub-rows under each category row (both layouts): indented, smaller, muted, name + `formatValue(value)`, no new component file |
| `ARCHITECTURE.md` | registry: `donut.ts` row gains `mergeCategorySegments`, `SubcategoryExpense` (same commit, CTX-3) |
| `specs/current/dashboard/spec.md` | Advisor only, at review (SPEC-2/3) |

### Read (allow-list)

- `ARCHITECTURE.md`
- `packages/shared/src/lib/calculation/donut.ts`
- `apps/web/src/components/charts/donut-categories-chart.tsx`
- `apps/web/__tests__/{donut-subcategories,m3-calculations}.test.ts`

### Reuse (from the registry)

- `counterValue` (`domain/conversion`), `round2` already in `donut.ts`.

### Style exemplars

- `packages/shared/src/domain/income-link.ts` — pure domain file (no new file here).

### Libraries

None new.

### Forbidden

- A new file, a segment per sub-category, changing colors / sort / `planned` semantics, touching `use-dashboard-data.ts`, `donut-card.tsx`, `dashboard-fullscreen-charts.tsx`, Sankey, schemas, Prisma, `dev.db`, `useEffect`, locked tests. Any file not listed: stop and ask.

## Tests

### Locked

- `apps/web/__tests__/donut-subcategories.test.ts` — breakdown rules, CHF conversion, planned/realized, merge helper (TEST-1).

Stub the Executor replaces: `mergeCategorySegments` body.

Proof of failure: `cd apps/web && npx jest __tests__/donut-subcategories.test.ts` → 8 failed, 2 passed (2 pins hold by construction).
`m3-calculations.test.ts` must stay green.

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Handoffs
