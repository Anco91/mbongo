# Handoff — 35-budget-consistency — 2026-11-25 15:10

Sub-spec: `specs/35-budget-consistency.md` · Handoff: `docs/handoffs/20261125-1510-35-budget-consistency.md` · Rules: SES-1..5

## Trigger

Advisor work of this session delivered (specs 35 and 38 framed and locked); ~30 tool calls (SES-2).

## Done

- Plan split (logged in the specs): 35 = pure budget fixes turning the 7 red `current` tests green; new row 38 = projected balance. Reason: the single 35 exceeded the Frame size limit.
- `specs/35-budget-consistency.md` (ready): rules pinned (provision /12, month-key bounds, one-hop Sankey, donut `monthKey?`), Frame, 6 production files. Locks `budget-journey.current.test.ts` + `due-charges.test.ts` (Advisor edited it: overdue PENDING now due).
- `specs/38-projected-balance.md` (ready): rules pinned, Frame, 7 production files + stub. Locks `budget-journey.projection.test.ts` (17 tests, hand-checked table in header).
- Advisor stubs (throw): `balanceAsOf` in `domain/balance.ts`, `lib/calculation/projected-balance.ts` + barrel line. Fixture extended append-only.
- Lock commit `56fad68`; spec commit `f734cc1`, pushed on `test/budget-journey-scenarios`. `test-lock.sh` exit 0 for 34, 35, 38.

## Left

1. Executor (tier medium, `agents-fw-executor`) implements 35 on `feat/35-budget-consistency` stacked on this branch; PR #80 and 35 land together.
2. Advisor at review of 35: update `specs/current/{monthly-budget,provisions,dashboard}/spec.md` (SPEC-3).
3. Executor implements 38 (stacked on 35); Advisor updates capability specs and reverses `dashboard/spec.md:207`.
4. Then 37, then 36.

## Decisions

- Projection counts provisioned payments as cash flow at their due date (D5); budget counts the provision (D8).
- Credit card: only the next cycle settles (card +encours, linked account -encours); deferred cards no move.
- ESTIMATED transfer without TARGET leg: expected credit at `rateEstimated` via exported `transferLegAmount`.
- Dues app wiring (overdue payments query) goes with 38, not 35.

## Files touched

`specs/35-*.md`, `specs/38-*.md`, `specs/SPEC_MASTER.md`, `apps/web/__tests__/{due-charges.test.ts, scenarios/budget-journey.projection.test.ts, stubs/budget-journey-fixture.ts}`, `packages/shared/src/{domain/balance.ts, lib/calculation/projected-balance.ts, index.ts}`.

## Tests

`cd apps/web && npx jest __tests__/scenarios __tests__/due-charges.test.ts` → 25 failed (8 for 35 + 17 for 38), 18 passed, by design. tsc and eslint clean on touched files. Hand-checked projection numbers are not yet proven by code: the Executor's first green run is the proof; a mismatch means re-check my table before touching code (test change request).

## Blockers / risks

- Full `npm run test` red on this branch by design; PR #80 stays draft.
- `cardBilling` uses local-time date-fns; TZ is pinned UTC in Jest only.

## Next action

Dispatch `agents-fw-executor` on spec 35.

## Resume block

```
NEXT SESSION
Role: executor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-1510-35-budget-consistency.md
Sub-spec: specs/35-budget-consistency.md (master: specs/SPEC_MASTER.md)
First action: Create branch feat/35-budget-consistency from test/budget-journey-scenarios and implement the Frame of 35 until the 8 locked red tests pass.
Stop: none
```
