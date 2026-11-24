# Handoff — net-worth-breakdown-hover — 2026-11-24 22:18

Sub-spec: `openspec/changes/net-worth-breakdown-hover/frame.md` · Handoff: `docs/handoffs/20261124-2218-net-worth-breakdown-hover.md` · Rules: SES-1..5

## Trigger

SES-2: ~40 tool calls in the PM session (row 08 executor dispatched, still running).

## Done

- Row 08 proposed, kickoff in `design.md`, Frame, locked tests: `c59bcdb` (tests + stub), `6e183f5` (frame, `locked_at: c59bcdb`), `d94753b` (master row 08 in-progress).
- Executor `agents-fw-executor` dispatched in background on branch `feat/net-worth-breakdown-hover` (commit expected with trailer `Spec:`, no push). Its result was not received at handoff time: check `git log` on the branch and `tasks.md` ticks.
- Row 09 explored (read only), nothing written.

## Left

1. Row 08: if the executor commit is absent or partial, re-dispatch `agents-fw-executor` on frame + tasks. Then run in `apps/web`: `npx jest`, `npm run typecheck`, `npm run lint`; root: `.agents-fw/scripts/test-lock.sh openspec/changes/net-worth-breakdown-hover/frame.md`, `arch-check.sh`. Dispatch `agents-fw-reviewer`. Advisor: update `specs/current/dashboard/spec.md` (SPEC-3). Push, PR, merge on green, archive change (`openspec archive`), master row 08 `done` with new frame path, handoff.
2. Row 09 (transfers archive). Findings: `Transfer.status` is a free `String` column in SQLite (no DB enum), so a new status value needs NO migration. Planned decision (log in `design.md`): closed status `CLOSED` (as accounts) rather than an archive flag, because the flag needs a migration (GIT-7 gate) and CLOSED mirrors `AccountStatus`. Impact list: `transferStatusSchema` (add `CLOSED`), `findLatestRate` (treat CLOSED with `rateEffective` as completed), `transfer.service.ts` `update` (409 if COMPLETED or CLOSED), new `close`/`reopen` service + route + controller + repository + hook, `transfers-content.tsx` (hide CLOSED by default, `ShowClosedToggle` pattern, « Clôturer » on COMPLETED, « Rouvrir » on CLOSED), `StatusBadge`/`payment-status.ts` label. Pure rule `canCloseTransfer` (only COMPLETED may be closed) locked-tested. Frame likely tier medium, ~10 files: consider splitting into domain+service slice and UI slice.
3. Row 10 (charge subcategories): explore; schema change = migration = GIT-7 gate. Prepare change, frame, locked tests, executor work not touching dev.db; do not run `prisma migrate` on dev.db; report the gate.

## Decisions

- Row 08: separate pure `listNetWorthTerms` (no change to `ConsolidatedBalance`), native currency terms, zero balances excluded, CSS group-hover/focus-within panel. Written in `openspec/changes/net-worth-breakdown-hover/design.md`.
- Row 09 decision pending write-up (see Left 2).

## Files touched

- `openspec/changes/net-worth-breakdown-hover/{proposal,design,tasks,frame}.md`, `specs/dashboard/spec.md` — created
- `apps/web/__tests__/net-worth-terms.test.ts` — created (locked)
- `packages/shared/src/lib/calculation/consolidated.ts` — stub, executor replaces it
- `specs/SPEC_MASTER.md` — row 08 in-progress
- Executor files per Frame (wealth-card, use-dashboard-data, dashboard-content, ARCHITECTURE.md): in flight

## Tests

`npx jest __tests__/net-worth-terms.test.ts` → 9 failed `not implemented` at lock time. test-lock.sh passed at `6e183f5`. Final results: to be rerun.

## Blockers / risks

- Never `git add -A`: untracked `apps/web/prisma/dev.db.bak-20261124-215210` must stay untracked.
- Locked tests income-matching.test.ts and settlement.test.ts have prettier errors: leave alone.

## Next action

Check the row 08 branch for the executor commit, verify checks, then dispatch the reviewer.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-2218-net-worth-breakdown-hover.md
Sub-spec: openspec/changes/net-worth-breakdown-hover/frame.md (master: specs/SPEC_MASTER.md)
First action: Check feat/net-worth-breakdown-hover for the executor commit, run checks, dispatch agents-fw-reviewer, then merge and move to row 09.
Stop: none
```
