# Handoff — charge-owner-scope — 2026-11-25 01:38

Sub-spec: `openspec/changes/charge-owner-scope/frame.md` · Handoff: `docs/handoffs/20261125-0138-charge-owner-scope.md` · Rules: SES-1..5

## Trigger

Frame ready; next step is the Prisma migration, a human gate (GIT-7).

## Done

- OpenSpec change `charge-owner-scope` opened: proposal, deltas (charge-management, dashboard), design, tasks, `frame.md` (status `ready`), `openspec validate` OK.
- Tests locked at `3b02a6e`: `charge-owner.test.ts`, `member-scope-charge-owner.test.ts` (21 fail for the right reason; old `member-scope.test.ts` still green). Stubs: `domain/charge-owner.ts`, `scopeToMember` accountId param. `test-lock.sh` exit 0.
- Master row 31 now `ready`, points at the frame. Branch `feat/charge-owner-scope` pushed, no PR yet.
- Check done: dev DB has 5 accounts, all with `memberId`; 2 members. No data fix needed.

## Left

- Human go-ahead for the Prisma migration (`Charge.memberId`, `Charge.shared`), then Executor tasks 1-10 in `tasks.md`, review, SPEC-3 update of `specs/current/charge-management` and `specs/current/dashboard`, PR, archive.

## Decisions

- Common charge shows only under Foyer; member charge follows the member on any account; account sub-scope needs a member and ignores `accountId` for Foyer.
- One select in the forms, mapped by `ownerChoiceToFields`/`fieldsToOwnerChoice`.
- New test file instead of editing locked `member-scope.test.ts`.

## Blockers / risks

- Migration: additive, nullable + default false, no backfill. Needs the human OK.

## Next action

Human says go for the migration; Executor (tier medium) starts at task 1 of the frame.

## Resume block

```
NEXT SESSION
Role: executor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-0138-charge-owner-scope.md
Sub-spec: openspec/changes/charge-owner-scope/frame.md (master: specs/SPEC_MASTER.md)
First action: After the human's go-ahead for the Prisma migration, run task 1 (schema + migration charge_owner) then follow tasks.md.
Stop: human-gate: Prisma migration needs the human go-ahead
```
