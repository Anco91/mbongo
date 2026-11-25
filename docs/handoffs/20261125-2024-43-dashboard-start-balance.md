# Handoff — 43-dashboard-start-balance — 2026-11-25 20:24

Sub-spec: `specs/43-dashboard-start-balance.md` · Handoff: `docs/handoffs/20261125-2024-43-dashboard-start-balance.md` · Rules: SES-1..5

## Trigger

SES-2: the session hook reported 44 tool calls (limit 40). Spec 43 is delivered and merged; nothing is in flight.

## Done

- PR #94 (`2635caa`): `MonthStartBalanceService.save` rejects CLOSED accounts (400), service test added (spec 40 review note).
- Spec 43 merged in PR #95 (`4e9591e`): `computeProjectedBalance` accepts `startOverrides`; a current/future month anchors an account with a saved start on start + flows of that month only; dashboard (`use-dashboard-data.ts`, `dashboard-guard.tsx`) and `useMonthStart` wired. Tests locked at `fbf2b28`.
- SPEC-3 done: `specs/current/monthly-budget/spec.md` has the "Solde de départ et projection du dashboard" requirement. Spec 43 and master row 43 are `done`.

## Left

- Nothing required.
- Optional: `useMonthStart` still repeats the `computeProjectedBalance` wiring of the dashboard (suspense vs non-suspense queries make a shared hook awkward); no endpoint to delete a saved start balance.

## Decisions

- Written in `specs/43-dashboard-start-balance.md` (Decisions): formula unchanged, per-account anchoring, window = the target month, past month ignores overrides.
- The dev server on :3000 was restarted by the Advisor with a clean `.next` after the earlier `build` corrupted it (user approved). Do not run `npm run build` while it runs.

## Files touched

- `packages/shared/src/lib/calculation/projected-balance.ts` — modified
- `apps/web/src/components/dashboard/{use-dashboard-data.ts,dashboard-guard.tsx}`, `apps/web/src/components/budget/use-month-start.ts` — modified
- `apps/web/__tests__/scenarios/budget-journey.start-balance.test.ts`, `apps/web/__tests__/month-start-balance.service.test.ts` — created
- `specs/43-dashboard-start-balance.md`, `specs/current/monthly-budget/spec.md`, `specs/SPEC_MASTER.md`, `ARCHITECTURE.md` — created or modified

## Tests

Locked test 12/12; `npm run test` 719 pass; typecheck, lint, `arch-check.sh`, `test-lock.sh` green. `npm run build` not run (dev server shares `.next`). Dev server GET `/`, `/budget/2026-11`, `/budget/2026-12` = 200, no writes.

## Blockers / risks

- None.

## Next action

None: wait for the next request.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-2024-43-dashboard-start-balance.md
Sub-spec: specs/43-dashboard-start-balance.md (master: specs/SPEC_MASTER.md)
First action: none, specs 40 and 43 are merged; take the next request or the next ready row of the master.
Stop: done
```
