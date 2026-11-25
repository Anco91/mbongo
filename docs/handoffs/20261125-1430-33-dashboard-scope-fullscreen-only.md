# Handoff — 33-dashboard-scope-fullscreen-only — 2026-11-25 14:30

Sub-spec: `specs/33-dashboard-scope-fullscreen-only.md` · Handoff: `docs/handoffs/20261125-1430-33-dashboard-scope-fullscreen-only.md` · Rules: SES-1..5

## Trigger

~40 tool calls (SES-2) and the human asked for a handoff. Sub-spec 33 delivered (PR #78).

## Done

- 33 implemented and pushed: `a157e98` on `feat/dashboard-scope-fullscreen-only`, PR #78 (base main, includes the docs commit). Lint, typecheck, tests green locally. App not run in a browser.
- `.gitignore` now ignores `exports-xls/` (commit on the feat branch, PR #78).
- Docs on `docs/budget-projection-specs`: `0ec58f0` (CSV findings, spec 37 row, D9), `29e8174` (spec 36 narrowed).

## Left

1. Advisor: update `specs/current/dashboard/spec.md` (SPEC-3) and `docs/LEXIQUE.md` for 33 at review; merge PR #78 on green.
2. Advisor: write and lock sub-spec 34 (two multi-month scenario files; hand-check expected numbers in a table at the top of each file first), then Frame of 35.
3. Advisor: write 37 (external transfers, `Transfer.memo` display/edit; Prisma migration is a human gate GIT-7), then 36.

## Decisions

- D9: import never creates transfers (no IBAN in the BNP CSV). Human 2026-11-25: import is two moments a month (start: situation and remaining to live; end: last-month analysis), client-side from a file input, amounts summed directly (debit negative). Spec 36 V1 = balance anchor + spending analysis by category/merchant; no auto-matching. Written in `docs/plans/20261125-budget-projection-import.md`.
- Order: 33 → 34 → 35 → 37 → 36.

## Files touched

- `apps/web/src/components/dashboard/{dashboard-content.tsx,member-scope-chips.tsx,use-dashboard-data.ts}`, `ARCHITECTURE.md`, `.gitignore`
- `docs/plans/20261125-budget-projection-import.md`, `specs/SPEC_MASTER.md`

## Tests

`npm run lint`, `npm run typecheck`, `npm run test`: all pass. No locked test touched.

## Blockers / risks

- Known edge: `?compte=` pointing at a SAVINGS account is still accepted from the URL; only the chip list excludes it.
- 35 touches Sankey/donut totals: Advisor updates those tests.
- Merchant → category mapping for 36 needs a storage decision (new model = migration gate).

## Next action

Advisor writes sub-spec 34.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-1430-33-dashboard-scope-fullscreen-only.md
Sub-spec: specs/33-dashboard-scope-fullscreen-only.md (master: specs/SPEC_MASTER.md)
First action: Review PR #78 (update specs/current/dashboard/spec.md), then write and lock sub-spec 34 from docs/plans/20261125-budget-projection-import.md.
Stop: none
```
