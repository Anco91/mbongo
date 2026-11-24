# Handoff — 12-sankey-income-leg — 2026-11-24 19:51

Sub-spec: `specs/12-sankey-income-leg.md` · Handoff: `docs/handoffs/20261124-1951-12-sankey-income-leg.md` · Rules: SES-1..5

## Trigger

Sub-spec delivered (merged #30, UI tests purged #31), reviewed and closed.

## Done

- Sankey income leg on expected income, planned links without stripes (99b6a6c).
- UI tests removed per TEST-2 (355e2e8); obsolete locked case removed, relocked c8fcbd6.
- Review done (approve); `amount > 0` guard added on cross-month linked transactions; SPEC-3 dashboard capability, ARCHITECTURE decision, master row `done`.

## Left

- Human visual check of criterion 6 (no stripes on planned Sankey links).
- Optional: remove unused `@testing-library` / jsdom dependencies.

## Decisions

- Frontend/UI tests are not written nor kept (TEST-2); human decision 2026-11-24.
- Unmatched positives leave the Sankey until spec 14 (ARCHITECTURE.md Decisions).

## Files touched

- `packages/shared/src/lib/calculation/{sankey,active-accounts}.ts`, `apps/web/src/components/dashboard/use-dashboard-data.ts`, `apps/web/src/components/charts/sankey-flows-chart.tsx` — modified
- `specs/current/dashboard/spec.md`, `specs/12-sankey-income-leg.md`, `specs/SPEC_MASTER.md`, `ARCHITECTURE.md` — modified

## Tests

`npx jest` (apps/web): 39 suites, 401 tests pass. `tsc --noEmit` clean. `test-lock.sh` exit 0.

## Blockers / risks

- Stripe cause (dash array) is a hypothesis until the human checks the screen.

## Next action

Human checks criterion 6 on the dashboard, then pick the next row of the master index.

## Resume block

Paste this, filled, as the last message of the session (SES-4):

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-1951-12-sankey-income-leg.md
Sub-spec: specs/12-sankey-income-leg.md (master: specs/SPEC_MASTER.md)
First action: pick the next ready or draft row in specs/SPEC_MASTER.md (spec 14 or 15).
```
