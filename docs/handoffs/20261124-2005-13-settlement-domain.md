# Handoff — 13-settlement-domain — 2026-11-24 20:05

Sub-spec: `specs/13-settlement-domain.md` · Handoff: `docs/handoffs/20261124-2005-13-settlement-domain.md` · Rules: SES-1..5

## Trigger

Sub-spec delivered (merged #33, 5d13c0b).

## Done

- Tests locked bc19af3, `computeSettlement` implemented 34b2497, registry row + spec/master `done`, squash-merged as 5d13c0b.

## Left

- Human visual check of spec 12 criterion 6 (Sankey without stripes).
- Optional: remove unused `@testing-library` / jsdom dependencies.

## Decisions

- Tolerance default 0; below expected = partial, above = discrepancy; amounts are positive magnitudes, caller converts (spec 13).

## Files touched

- `packages/shared/src/domain/settlement.ts`, `apps/web/__tests__/settlement.test.ts`, `specs/13-settlement-domain.md` — created
- `packages/shared/src/index.ts`, `ARCHITECTURE.md`, `specs/SPEC_MASTER.md` — modified

## Tests

`npx jest settlement`: 12/12 pass. Typecheck clean. `test-lock.sh` exit 0.

## Blockers / risks

- none

## Next action

Write sub-spec 14 (unmatched income matching), which uses `computeSettlement`.

## Resume block

Paste this, filled, as the last message of the session (SES-4):

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-2005-13-settlement-domain.md
Sub-spec: specs/13-settlement-domain.md (master: specs/SPEC_MASTER.md)
First action: write sub-spec 14 (or 15) from its master row, reusing computeSettlement.
```
