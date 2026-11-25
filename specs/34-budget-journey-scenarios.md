---
id: 34-budget-journey-scenarios
status: review
branch: test/budget-journey-scenarios
tier: small
locked_at: 83e1767178a218a2a71327d397e57a09d0c939a5
locked_tests:
  - apps/web/__tests__/scenarios/budget-journey.current.test.ts
---

# 34 — Budget journey scenarios (multi-month, no UI)

Master: `specs/SPEC_MASTER.md` · Plan: `docs/plans/20261125-budget-projection-import.md` · Rules: WF-3, WF-7, TEST-1..5

## Summary

- Pourquoi : les calculs du budget sont testés un mois à la fois ; aucun scénario ne prouve qu'ils tiennent d'un mois à l'autre.
- Ce qui change : un jeu de données fictif (foyer FR/CH) et des tests verrouillés qui échouent là où le code actuel est faux. Aucun code de production.
- Aucun changement de comportement.

## Branch plan (decision)

These tests are red on purpose (7 failures). They must not reach `main` red (GIT-7 would block every PR).
The PR for this branch stays **draft and unmerged**. Spec 35 branches from it, turns the tests green and the two land together. Logged here, not asked.

## Acceptance criteria

1. `budget-journey.current.test.ts` compiles and fails on exactly the 7 assertions listed in "Proof of failure"; its 6 other tests pass today.
2. Every failing assertion maps to one defect of the plan's « Défauts constatés » and to the sub-spec 35 Frame.
3. Fixture is pure data, in `apps/web/__tests__/stubs/` (ignored by Jest `testPathIgnorePatterns`).

## Frame

Create (Advisor, done):
- `apps/web/__tests__/stubs/budget-journey-fixture.ts`: accounts, charges, payments, incomes, transactions; `TODAY` = 2026-11-15 noon UTC, `RATE` 1.05 (`counterValue(chf, 1.05)`), `convert`, `month(key)`.
- `apps/web/__tests__/scenarios/budget-journey.current.test.ts`: existing functions only. Hand-checked table at the top of the file.

Executor: none. Spec 35 fixes the code; it never edits these tests.

Read allow-list: none.

## Tests

### Locked

- `apps/web/__tests__/scenarios/budget-journey.current.test.ts`

### Proof of failure

`cd apps/web && npx jest __tests__/scenarios` → `Tests: 7 failed, 6 passed, 13 total`.

| Test | Expected | Received | Defect (35 must fix) |
|---|---|---|---|
| provision, Aug 2026 | 100 | 150 | `monthlyProvision` ignores `startDate` (`schedule.ts:301-305`) |
| provision, Jan 2027 | 100 | 150 | same, `endDate` |
| CANCELLED payment, Oct | paymentsTotal 900 | 930 | `computeMonthlyBudget` counts CANCELLED/FAILED (`schedule.ts:518-527`) |
| CHF provision, Nov | 29.31 | 27.92 | provision sums raw amounts, no `convert` |
| dues, Nov | 930 | 30 | overdue PENDING of past months dropped (`due-charges.ts:23`) |
| Sankey expenses, Nov | 1080 | 2130 | smoothed charge drawn by its payment, no provision branch (D8) |
| donut total, Nov | 1080 | 2130 | same |

Nov budget is 1080 = rent 900 + phone 30 + provisions 150 (insurance 100 + temporary tax 50). 2130 = 900 + 30 + insurance payment 1200.

### Decisions kept from the review of the plan

- « PENDING later in the current month counts as due » is **not** a defect: `due-charges.test.ts` and the capability spec require it. Only overdue past-month PENDING is locked red.
- The plan's « provision branch » (D8) changes existing Sankey/donut expectations: 35's Frame lists those test files as Advisor-modified.
- Not locked here (glue or needs 35 signatures): WealthCard ignoring the month cursor, `computeMonthlyBudget` called without `convert` in `use-dashboard-data.ts`, ProvisionsCard receiving every charge, the two « Reste à vivre » meanings, balance capped by date, projected balance, paying a due, CHF→EUR transfer, deferred card, closed account. They go in the `projection` file, written next (scenarios 1, 2 patrimoine, 4 patrimoine, 6 to 9, 11).

## Out of scope

- `budget-journey.projection.test.ts` (needs the signatures of 35: `balanceAsOf`, `computeProjectedBalance`, `computeMonthState`).
- Any production code.

## Handoffs

(none yet)
