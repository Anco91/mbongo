# Handoff — 30-due-charges-owner-scope — 2026-11-25 01:30

Sub-spec: `specs/30-due-charges-owner-scope.md` · Handoff: `docs/handoffs/20261125-0130-30-due-charges-owner-scope.md` · Rules: SES-1..5

## Trigger

Human asked to change session after the planning session and change C.

## Done

- Change C (donut percentages) delivered: PR #71, merge 4c8cfcc, `formatPercent` in `donut.ts`, tests green.
- Plan validated by the human; written into `specs/30-due-charges-owner-scope.md` (rows 30 and 31 in the master).

## Left

- Row 30 (change A): OpenSpec change `due-charges-net-worth` (proposal, design, tasks, frame.md), lock tests, implement, review, PR.
- Row 31 (change B): after A. Stop before the Prisma migration (human gate).

## Decisions

- Defaults and ordering logged in the spec section « Decisions »; copy them into each change's `design.md`.
- Change C counted as fast-track although it touched 4 files (test + ARCHITECTURE row as accessories).

## Files touched

- `specs/30-due-charges-owner-scope.md` — created
- `specs/SPEC_MASTER.md` — rows 30, 31
- `docs/handoffs/20261125-0130-30-due-charges-owner-scope.md` — created

## Tests

Change C: `npx jest donut` 13 passed, `npx tsc --noEmit` clean, prettier clean. No test written yet for A or B. Commands run from `apps/web` (no `pnpm` on this machine; use `npx`/`npm`).

## Blockers / risks

- None for A. B needs the migration gate. No CI on the repo: merge after local tests.

## Next action

Advisor starts the OpenSpec change for row 30 (change A) from `specs/30-due-charges-owner-scope.md`, section « Change A ».

## Resume block

Paste this, filled, as the last message of the session (SES-4):

```
NEXT SESSION
Role: <advisor|executor|reviewer>
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-0130-30-due-charges-owner-scope.md
Sub-spec: specs/30-due-charges-owner-scope.md (master: specs/SPEC_MASTER.md)
First action: <one sentence>
Stop: none | done | human-gate: <reason>
```
