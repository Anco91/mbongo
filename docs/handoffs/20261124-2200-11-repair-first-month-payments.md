# Handoff — 11-repair-first-month-payments — 2026-11-24 22:00

Sub-spec: `specs/11-repair-first-month-payments.md` · Rules: SES-1..5

## Trigger

Sub-spec delivered (PR #43 merged) and applied.

## Done

- Script `apps/web/scripts/repair-first-month-payments.cjs` merged (#43). Dry run read: 14 payments (CHF 1418.15, EUR 1507.30), « Impôt FR » untouched.
- `--apply` run once on `dev.db`: backup `apps/web/prisma/dev.db.bak-20261124-215210`, 14 created; second run: 0 created.
- Lint fast-track (#41) and master triage (#42): rows 04, 05, 15 stay draft (low value), row 20 deferred (9 transactions in dev.db; filter and cursor need server changes outside its Frame; trigger > 400 transactions).

## Left

- Rows 16, 08 (draft, no spec file), 09 (design to decide), 10 (migration gate).
- 12 prettier errors remain in locked tests `__tests__/income-matching.test.ts` and `__tests__/settlement.test.ts`: human gate (TEST-5).
- The backup file is untracked; the human may delete it, and may delete the one-off script.

## Next action

Write the OpenSpec change for row 16: per-account card showing `computeSnapshotGap` (already in `domain/balance.ts`, unused).

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-2200-11-repair-first-month-payments.md
Sub-spec: none (master: specs/SPEC_MASTER.md)
First action: Write the OpenSpec change for row 16 (statement gap per account, reuse computeSnapshotGap).
Stop: none
```
