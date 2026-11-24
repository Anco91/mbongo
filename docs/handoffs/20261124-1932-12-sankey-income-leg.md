# Handoff — 12-sankey-income-leg — 2026-11-24 19:32

Sub-spec: `specs/12-sankey-income-leg.md` · Handoff: `docs/handoffs/20261124-1932-12-sankey-income-leg.md` · Rules: SES-1..5

## Trigger

Tool-call budget (~40) reached after writing sub-specs 11 and 12.

## Done

- Accounting decision (matching model, option a, no ledger) in `ARCHITECTURE.md`; master glossary extended; rows 13-16 split (75e4463, then docs commit).
- Sub-spec 11 written, status `ready` (b0a4e53). No locked tests (one-off glue).
- Sub-spec 12 Frame written, status `draft` (tests not yet locked).

## Left

1. Write and lock tests for 12 (`write-tests.md`): rewrite the sankey cases in `apps/web/__tests__/m3-calculations.test.ts` that use a positive transaction as income; add cases for acceptance criteria 1-5; stub the new `incomes`/`monthKey` params only as far as the runner needs. Then `test-lock.sh`, set `ready`, ask the human to validate.
2. Executor runs 11 (tier small), human reads the dry run, then `--apply`.
3. Review 12, then update `specs/current/dashboard/spec.md` (SPEC-3).
4. Rows 13-16 stay draft; before 14, check budget and charts exclude transfer legs from income.

## Decisions

- Matching model (a), internal transfer neutral for budget and net worth: `ARCHITECTURE.md` Decisions.
- 12: unmatched positives leave the Sankey income leg until spec 14 (option 2). Stripes: hypothesis is `strokeDasharray` on wide strokes; fix is opacity only; human checks on screen.

## Files touched

- `ARCHITECTURE.md`, `specs/SPEC_MASTER.md` — modified
- `specs/11-repair-first-month-payments.md`, `specs/12-sankey-income-leg.md` — created

## Tests

No code or test touched this session.

## Blockers / risks

- Stripes cause in 12 is unverified.
- `dev.db` untouched. « Impôt FR » (TEMPORARY, existing payment 2026-11-25) may get an extra payment from sub-spec 11: read the dry run.

## Next action

Write and lock the tests for sub-spec 12.

## Resume block

Paste this, filled, as the last message of the session (SES-4):

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-1932-12-sankey-income-leg.md
Sub-spec: specs/12-sankey-income-leg.md (master: specs/SPEC_MASTER.md)
First action: Write and lock the tests of sub-spec 12, then set it ready for the human.
```
