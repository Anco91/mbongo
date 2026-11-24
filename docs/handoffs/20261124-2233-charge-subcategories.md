# Handoff — charge-subcategories — 2026-11-24 22:33

Sub-spec: `openspec/changes/charge-subcategories/frame.md` · Handoff: `docs/handoffs/20261124-2233-charge-subcategories.md` · Rules: SES-1..5

## Trigger

Advisor step delivered: change proposed, Frame written, tests locked, branch pushed. Next role is Executor.

## Done

- Explored row 10; split into 10a (this change: column, taxonomy, server rule, forms, detail) and 10b (donut breakdown, master row draft).
- Tests locked d16cc40 (`charge-category.test.ts`, `charge-subcategory.service.test.ts`); stub `domain/charge-category.ts` + barrel line.
- Change, Frame, master row 10 `ready`, migration SQL prepared and `schema.prisma` column added: 12cd68b. Branch `feat/charge-subcategories` pushed, no PR yet.

## Left

- Executor implements the Frame, opens the PR (one change = one PR).
- Advisor at review merges the delta into `specs/current/charge-management/spec.md` (SPEC-3).
- Row 10b: write its change after 10a merges.

## Decisions

- Nullable `subcategory` column, closed list in code, `category` stays free text; LAMal under Santé; category change alone resets sub-category. Written in `design.md`.

## Files touched

- `openspec/changes/charge-subcategories/` — created
- `packages/shared/src/domain/charge-category.ts`, `packages/shared/src/index.ts` — stub, barrel
- `apps/web/prisma/schema.prisma`, `apps/web/prisma/migrations/20261124230000_add_charge_subcategory/` — modified, created
- `apps/web/__tests__/charge-category.test.ts`, `charge-subcategory.service.test.ts` — created
- `specs/SPEC_MASTER.md` — rows 10 and 10b

## Tests

`cd apps/web && npx jest __tests__/charge-category.test.ts __tests__/charge-subcategory.service.test.ts`: 27 failed, 3 passed (expected, stubs). `test-lock.sh` exit 0. `openspec validate` valid. `arch-check.sh` exit 0.

## Blockers / risks

- Human gate (GIT-7): applying the migration to `dev.db`. Not applied; harmless to apply first (nullable column). No merge before it; do not run the app before it. Executor runs `npx prisma generate` only.
- Untracked `apps/web/prisma/dev.db.bak-20261124-215210` left alone.

## Next action

Executor reads the Frame and implements it on `feat/charge-subcategories`, then opens the PR.

## Resume block

```
NEXT SESSION
Role: executor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-2233-charge-subcategories.md
Sub-spec: openspec/changes/charge-subcategories/frame.md (master: specs/SPEC_MASTER.md)
First action: git checkout feat/charge-subcategories, implement the Frame (prisma generate only, never apply the migration), then open the PR; no merge before the migration is applied.
Stop: human-gate: apply migration 20261124230000_add_charge_subcategory to dev.db
```
