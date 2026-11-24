# Handoff — account-statement-gap — 2026-11-24 21:54

Sub-spec: `openspec/changes/account-statement-gap/frame.md` · Handoff: `docs/handoffs/20261124-2154-account-statement-gap.md` · Rules: SES-1..5

## Trigger

Spec phase of row 16 done (proposal, delta, design with kickoff, tasks, frame, tests locked). Executor next (tier medium).

## Done

- OpenSpec change `account-statement-gap` valid (`openspec validate`). Master row 16 now `ready`.
- Tests locked at `5afd317`: `apps/web/__tests__/statement-gap.test.ts`, 10 tests, failing with `not implemented`. Stub `computeStatementGap` in `packages/shared/src/domain/balance.ts`.
- Branch `feat/account-statement-gap` pushed. No PR yet (open it after apply).

## Left

- Executor: tasks 1.1 to 3.4 of `tasks.md`, inside the Frame.
- Review, then Advisor updates `specs/current/account-management/spec.md` (SPEC-3), archive, PR, merge.
- Later rows: 08, 09 (design to choose), 10 (migration gate). New row to add: snapshot entry form (out of scope here).

## Decisions

- Gap computed at the snapshot date, day granularity; latest snapshot only; rounded to cent. See `design.md`.
- Read-only slice; snapshot entry deferred.

## Files touched

- `openspec/changes/account-statement-gap/*` — created
- `specs/SPEC_MASTER.md` — modified (row 16)
- `apps/web/__tests__/statement-gap.test.ts`, `packages/shared/src/domain/balance.ts` — created / modified (stub)

## Tests

`npx jest __tests__/statement-gap.test.ts` → 10 failed (`not implemented`), expected. `test-lock.sh` rc=0.

## Blockers / risks

- Human gate pending: 12 prettier errors in locked tests `income-matching.test.ts`, `settlement.test.ts`. Reformat needs human OK.
- Untracked `apps/web/prisma/dev.db.bak-20261124-215210`: human may delete.
- dev.db has 2 snapshots only; card gap shows for those accounts.

## Next action

Dispatch `agents-fw-executor` on the Frame of `account-statement-gap`.

## Resume block

```
NEXT SESSION
Role: executor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-2154-account-statement-gap.md
Sub-spec: openspec/changes/account-statement-gap/frame.md (master: specs/SPEC_MASTER.md)
First action: Implement tasks.md inside the Frame; make the 10 locked tests pass.
Stop: none
```
