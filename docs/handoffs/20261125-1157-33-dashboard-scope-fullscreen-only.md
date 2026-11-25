# Handoff — 33-dashboard-scope-fullscreen-only — 2026-11-25 11:57

Sub-spec: `specs/33-dashboard-scope-fullscreen-only.md` · Handoff: `docs/handoffs/20261125-1157-33-dashboard-scope-fullscreen-only.md` · Rules: SES-1..5

## Trigger

~40 tool calls (SES-2). Planning session (Advisor) finished: plan approved by the human, no production code written.

## Done

- Explored dashboard charts and the budget/balance logic (read-only), read the BNP `.xls` export, researched bank APIs.
- Plan written and approved: `docs/plans/20261125-budget-projection-import.md` (decisions D1-D8, defects list, scenarios for 34, import design for 36, API research).
- Sub-spec 33 written (`ready`); master rows 33-36 added. All uncommitted at handoff time except as stated below.

## Left

1. Commit this branch (`docs/budget-projection-specs`) and push; no `verify` needed (docs only).
2. Executor: implement 33 (small, no locked test).
3. Advisor: write and lock sub-spec 34 (two scenario files; hand-check expected numbers in a table at the top of each file first), then Frame of 35.
4. Advisor: write spec 36 once the human drops a real BNP **CSV** export into `exports-xls/` (separator, encoding, date format, amount sign unknown).
5. Review of 33 and 35: update `specs/current/dashboard/spec.md`, `monthly-budget`, `provisions` (SPEC-3) and `docs/LEXIQUE.md` labels.

## Decisions

- D1-D8 in `docs/plans/20261125-budget-projection-import.md`. Human-given 2026-11-25: BNP CSV exists (drop `.xls`/SheetJS); bank APIs (PSD2) checked and not retained for V1; chart account sub-chips exclude `SAVINGS` accounts.
- Master invariant « no open banking in V1 » stays.

## Files touched

- `docs/plans/20261125-budget-projection-import.md` — created
- `specs/33-dashboard-scope-fullscreen-only.md` — created
- `specs/SPEC_MASTER.md` — rows 33-36 added
- `docs/handoffs/20261125-1157-33-dashboard-scope-fullscreen-only.md` — this file

## Tests

None run. No locked test touched.

## Blockers / risks

- 36 needs a real CSV sample from the human.
- 35 touches Sankey/donut totals (D8): confirm in the Frame that donut/sankey tests in `apps/web/__tests__` are updated by the Advisor, not the Executor.
- Unverified in code: due-date timezone handling and `isWithinInterval` in `income.ts:48-62`.

## Next action

Commit and push the docs branch, then dispatch the Executor on `specs/33-dashboard-scope-fullscreen-only.md`.

## Resume block

```
NEXT SESSION
Role: executor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-1157-33-dashboard-scope-fullscreen-only.md
Sub-spec: specs/33-dashboard-scope-fullscreen-only.md (master: specs/SPEC_MASTER.md)
First action: Commit and push branch docs/budget-projection-specs, then implement sub-spec 33 inside its Frame.
Stop: none
```
