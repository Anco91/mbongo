# Handoff — net-worth-breakdown-hover — 2026-11-24 22:18

Sub-spec: `openspec/changes/net-worth-breakdown-hover/frame.md` · Handoff: `docs/handoffs/20261124-2218-net-worth-breakdown-hover-2.md` · Rules: SES-1..5

## Trigger

SES-2: ~40 tool calls reached before verification and commit.

## Done

- All Frame edits written, UNCOMMITTED and UNVERIFIED (no test, typecheck or lint run yet).
- `listNetWorthTerms` implemented in `consolidated.ts` (active only, round2, drop 0, sort balance desc then name).
- `useDashboardData` returns `netWorthTerms`; `DashboardContent` passes `terms` to `WealthCard`.
- `WealthCard`: `terms` prop, `NetWorthTermRow`, `group` + `tabIndex={0}` on Card, panel `hidden group-hover:block group-focus-within:block`.
- `ARCHITECTURE.md` registry row added.

## Left

- Run from apps/web: `npx jest`, `npm run typecheck`, `npm run lint` (ignore prettier errors in income-matching.test.ts and settlement.test.ts).
- Check `NetWorthTerm` is exported from `@mbongo/shared` (barrel is `export *`, expected fine).
- Check `Card` accepts `tabIndex` (it spreads HTMLAttributes, expected fine).
- Root: `.agents-fw/scripts/test-lock.sh openspec/changes/net-worth-breakdown-hover/frame.md` and `.agents-fw/scripts/arch-check.sh`.
- Tick `openspec/changes/net-worth-breakdown-hover/tasks.md` (1.1, 2.1, 2.2, 2.3).
- Commit with explicit paths (never `git add -A`; `apps/web/prisma/dev.db.bak-*` stays untracked), trailer `Spec: openspec/changes/net-worth-breakdown-hover/frame.md`. Do not push.

## Decisions

- Sort uses `b.balance - a.balance || a.name.localeCompare(b.name)`: one comparator gives assets desc then overdrafts most negative first.

## Files touched

- `packages/shared/src/lib/calculation/consolidated.ts` — modified
- `apps/web/src/components/dashboard/use-dashboard-data.ts` — modified
- `apps/web/src/components/dashboard/dashboard-content.tsx` — modified
- `apps/web/src/components/dashboard/cards/wealth-card.tsx` — modified
- `ARCHITECTURE.md` — modified
- `docs/handoffs/20261124-2218-net-worth-breakdown-hover-2.md` — created

## Tests

Not run yet.

## Blockers / risks

- none

## Next action

Run jest, typecheck, lint, test-lock and arch-check, fix any failure, tick tasks.md, commit.

## Resume block

```
NEXT SESSION
Role: executor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-2218-net-worth-breakdown-hover-2.md
Sub-spec: openspec/changes/net-worth-breakdown-hover/frame.md (master: specs/SPEC_MASTER.md)
First action: Run the verification commands listed in "Left", fix failures, tick tasks.md and commit.
Stop: none
```
