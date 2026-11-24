# Handoff — 07-budget-remaining-recompute — 2026-11-24 18:57

Sub-spec: `specs/07-budget-remaining-recompute.md` · Handoff: `docs/handoffs/20261124-1857-07-budget-remaining-recompute.md` · Rules: SES-1..5

## Trigger

~40 tool calls. Human gate pending: validation of 07 (ready, tests locked).

## Done

- 03 and 06 merged (#28, #27), master index fixed, worktrees removed except opencode one (permission denied).
- 07 written, tests locked (f315db3), spec ready (d7fa3ec), branch `feat/07-budget-remaining-recompute` pushed. Executor NOT run.

## Diagnosis (dev.db, from the user's screenshots of recap and dashboard)

| Symptom | Cause (evidence) | Fix slice |
|---|---|---|
| Recap « Revenus 4789.90 EUR » (user expects 6600 CHF) | = 4400 CHF one-off « Salaire novembre 2026 » (2026-11-01, no incomeId) on **UBS Courant, CLOSED**, converted. Source « Salaire » 6600 CHF monthly start 2026-11-03 is not counted | 07 (ready). One-off excluded: confirmed by the user's expectation of 6600 |
| Charges 711 EUR, provisions 0 | The 14 recurring charges have `startDate` = 2026-11-23 (creation day) and their payments start in December (60 each, **0 in November**). Only « Impôt FR » (start 2026-09-25) has a November payment. Same root as symptom 4 of archived `fix-budget-charts-alerts-dueday` (recurrence anchored on startDate / creation date). No charge is flagged `provisioned` → provisions 0 is data, not a bug | NEW row to write: November payments missing for charges created mid-month (anchor on `dueDay`/month start, not creation day). `feat/charge-payment-recovery` is already in `main`: read what it did before specing |
| Sankey = wall of thin bars, donut 711 € only | Not verified. Same missing payments feed both (only 711 planned). `sankey-flows-chart.tsx` / `sankey.ts` handle `planned` (dashed links): a thick dashed link may render as stripes. Income leg is realized-only and the 4400 is on a closed account hidden by 06 → no income node | NEW row: Sankey income leg (expected income) + planned-link rendering. After the charges fix |

Correction to earlier message: « peur sans objet » was only true for the income formula; the charges side (missing payments) is a real defect.

## Left (order)

1. Human validates 07 (go) → Executor tier small → review → PR → merge → SPEC-3 update of `specs/current/monthly-budget/spec.md` (recap income = expected income, supersedes D1/D8).
2. Write new row 11 « charges created mid-month have no payment for their first month » (read what `feat/charge-payment-recovery` already fixed; schedule.ts anchoring), then row 12 Sankey income leg + planned rendering. Add both to the master as draft.
3. Do not delete the user's closed-account one-off transaction.

## Decisions

- Recap income = expected income (user, 2026-11-24); Decisions row in ARCHITECTURE.md is part of 07's Frame (done by the Executor).
- One-off positive transactions without `incomeId` are ignored by the recap.

## Files touched

- `packages/shared/src/domain/income.ts` — stub + types (locked-tests commit)
- `apps/web/__tests__/month-expected-income.test.ts` — created, locked
- `specs/07-budget-remaining-recompute.md`, `specs/SPEC_MASTER.md` — created/modified

## Tests

`cd apps/web && npx jest __tests__/month-expected-income.test.ts` → 9 failed (not implemented, expected). `test-lock.sh specs/07-…` → 0. Typecheck clean.

## Blockers / risks

- Worktree `~/.local/share/opencode/worktree/f905f2/feat-charge-payment-recovery` still present (removal denied by permission classifier; user can run it with `!`).
- Sankey cause unverified.

## Next action

Ask the human for « go » on 07, then dispatch `agents-fw-executor-small`.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-1857-07-budget-remaining-recompute.md
Sub-spec: specs/07-budget-remaining-recompute.md (master: specs/SPEC_MASTER.md)
First action: Get the human's go on 07, dispatch agents-fw-executor-small, then write rows 11 (missing first-month payments) and 12 (Sankey income leg).
```
