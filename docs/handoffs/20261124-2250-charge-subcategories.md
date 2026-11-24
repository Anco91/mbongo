# Handoff — charge-subcategories — 2026-11-24 22:50

Sub-spec: `openspec/changes/charge-subcategories/frame.md` · Handoff: `docs/handoffs/20261124-2250-charge-subcategories.md` · Rules: SES-1..5

## Trigger

Sub-spec delivered: implemented, reviewed (APPROVE), PR #52 open. Only the human gate remains.

## Done

- Executor: Frame implemented 9b4a243; Charge fixtures `subcategory: null` 71aee06 (Frame amended 8c789fb, logged in `design.md`).
- Review: APPROVE, no blocking or high finding (two LOW notes: sub-category clearing written in both forms' resolvers).
- SPEC-3: `specs/current/charge-management/spec.md` updated 9aeda6b.
- PR: https://github.com/Anco91/mbongo/pull/52 (not merged).

## Left

- Human: apply migration `20261124230000_add_charge_subcategory` to `dev.db`, then merge PR #52.
- Advisor: write row 10b change (donut sub-category breakdown) after 10a merges.

## Decisions

- Keep `Charge.subcategory` required in the inferred type; fixtures get `subcategory: null` (`design.md`, "Frame amendment").

## Files touched

- `packages/shared/src/{domain/charge-category.ts,schemas/charge.ts}`, `apps/web/src/server/charges/charge.service.ts` — modified
- `apps/web/src/components/charges/charge-category-fields.tsx` — created; create/edit forms and detail — modified
- 5 existing test fixtures (m3-calculations, schedule x3, m5-filters) — modified
- `ARCHITECTURE.md`, `specs/current/charge-management/spec.md`, `openspec/changes/charge-subcategories/` — modified

## Tests

Locked 30/30 pass; full jest 48 suites / 507 tests; `tsc --noEmit` clean; build passes; `test-lock.sh` and `arch-check.sh` exit 0. Lint: 16 prettier errors in untouched or locked test files, same count without the change.

## Blockers / risks

- Human gate (GIT-7): migration not applied to `dev.db`. Do not run the app before applying it ("no such column").
- Untracked `apps/web/prisma/dev.db.bak-20261124-215210` left alone.

## Next action

Human applies the migration and merges PR #52; then the Advisor writes the row 10b change.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-2250-charge-subcategories.md
Sub-spec: openspec/changes/charge-subcategories/frame.md (master: specs/SPEC_MASTER.md)
First action: after PR #52 is merged, write the row 10b change (donut sub-category breakdown) on a new branch.
Stop: human-gate: apply migration 20261124230000_add_charge_subcategory to dev.db, then merge PR #52
```
