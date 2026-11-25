# Handoff — 38-projected-balance — 2026-11-25 15:24

Sub-spec: `specs/38-projected-balance.md` · Handoff: `docs/handoffs/20261125-1524-38-projected-balance.md` · Rules: SES-1..5

## Trigger

SES-2: ~40 tool calls. Executor delivered; PM verified.

## Done

- Spec 38 implemented, committed locally on `feat/38-projected-balance`: be7831a (domain, queries, hook, wealth card), 3f79eb4 (dashboard-content wiring, recap label, Frame amended with 2 rows).

## Left

- Advisor SPEC-3: update `specs/current/{dashboard,monthly-budget}/spec.md`, reverse `dashboard/spec.md:207`.
- Review (reviewer agent), then push, PR, merge on green.
- App check: December wealth card reads « Projeté fin décembre »; a future-dated transaction does not move today's wealth; Nov 2026 Sankey/donut/budget totals equal (spec 35 criterion 3, not yet done).

## Decisions

- Frame amended with `dashboard-content.tsx` and `recap-step.tsx` rows (PM decision, in `specs/38-projected-balance.md`).
- Month label drops the year: `monthLongLabel(selectedMonth).split(' ')[0]`.

## Files touched

- packages/shared: `balance.ts`, `projected-balance.ts`, `sankey.ts` — modified
- apps/web: `queries/payments.ts`, `use-dashboard-data.ts`, `dashboard-guard.tsx`, `wealth-card.tsx`, `dashboard-content.tsx`, `recap-step.tsx` — modified
- `docs/LEXIQUE.md`, `ARCHITECTURE.md`, `specs/38-projected-balance.md` — modified

## Tests

`npm test`: 64 suites, 668 tests pass (projection 17/17). Typecheck and lint pass. `test-lock.sh specs/38-projected-balance.md` exit 0 (executor run).

## Blockers / risks

- none

## Next action

Advisor updates the two `specs/current` capability files, then dispatch the reviewer.

## Resume block

Paste this, filled, as the last message of the session (SES-4):

```
NEXT SESSION
Role: <advisor|executor|reviewer>
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-1524-38-projected-balance.md
Sub-spec: specs/38-projected-balance.md (master: specs/SPEC_MASTER.md)
First action: <one sentence>
Stop: none | done | human-gate: <reason>
```
