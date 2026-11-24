# Handoff — 09 transfers archive (Advisor step pending)

Trigger: SES-2 (tool calls over limit) in the root session; the PM sub-agent cannot do the Advisor step.

## Done
- Row 08 delivered: PR #47 merged (main f4237bd), archived, row done. Its older handoffs (2218, 2220) are stale.
- Nothing started for 09 or 10: no change folder, no spec file, tree clean (only `apps/web/prisma/dev.db.bak-20261124-215210` untracked, keep it so).

## Left (ordered)
1. Advisor: create `openspec/changes/transfers-archive/` (proposal, design.md with decisions below, tasks.md, specs delta, frame.md), master row 09 path = its frame.md.
2. Advisor: locked tests for `findLatestRate` (CLOSED counts as realized) and the 409 on completing a closed transfer. Run `.agents-fw/scripts/test-lock.sh`.
3. PM: dispatch `agents-fw-executor`, then `agents-fw-reviewer`, merge, archive, row 09 done.
4. Row 10 (charge subcategories): same flow; the schema migration is a GIT-7 gate: prepare, do not apply to dev.db, report.
5. Skip rows 04, 05, 15, 20 (triaged 2026-11-24).

## Decisions (to write in design.md)
- `Transfer.status` gets value `CLOSED` (column is free text, no migration).
- `findLatestRate` treats CLOSED as realized.
- Completing a closed transfer returns 409.
- Closed transfers hidden by default, same toggle pattern as closed accounts (row 06).

## Files to read
`packages/shared/src/schemas/transfer.ts`, `apps/web/src/server/transfers/{transfer.service,transfers.controller}.ts`, `apps/web/src/repositories/transfers.repository.ts`, `apps/web/src/components/transfers/*`, `apps/web/src/queries/transfers.ts`.

## Blockers
- PM role cannot write Frames or locked tests: the next session must be Advisor.
- zsh: quote globs (`--include="*.ts"`). Never `git add -A`.
