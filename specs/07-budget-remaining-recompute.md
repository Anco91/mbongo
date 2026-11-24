---
id: 07-budget-remaining-recompute
status: ready
branch: feat/07-budget-remaining-recompute
tier: small
locked_at: f315db31f847295635ef992fdb3e7f1b2e85a038
locked_tests:
  - apps/web/__tests__/month-expected-income.test.ts
---

# 07 — Recap « reste à vivre » on expected income

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5

## Summary

Le récapitulatif du budget calcule ses revenus depuis les seules transactions réalisées : un mois non encore confirmé affiche 0 de revenus, donc un reste à vivre faux. Un budget se prépare sur les revenus attendus. Le récap affiche désormais les revenus prévus (montant confirmé s'il existe, sinon montant de la source), pour un mois préparé comme pour un mois en préparation. Comportement visible modifié : tuile « Revenus prévus » et reste à vivre.

## Goal

The recap's income is the month's expected income: each active source due in the month, counted at
its confirmed amount when confirmed, else at its planned amount. « Reste à vivre » = expected income −
charges (provisions included, already in `totalCharges`).

## Diagnosis (checked in `apps/web/prisma/dev.db`, 2026-11-24)

- `RecapStep` takes income from `computeMonthIncome` over the month's positive, non-transfer
  transactions only. Single call site in the app (`grep computeMonthIncome`).
- Dev DB: one source « Salaire » 6 600 CHF monthly, start 2026-11-03, no confirmation yet. The only
  positive November transaction is a 4 400 CHF one-off without `incomeId`. A month with a source but no
  transaction shows 0 income.
- Confirmation (`IncomeService.confirm`) upserts a transaction with `incomeId` + `budgetMonth`: this
  link identifies the confirmed amount of a source for a month.
- **Supersedes decision D1 / D8 (archived)**: « revenus = transactions positives du mois ». Human
  decision of 2026-11-24: a budget is built on expected income, not on realized transactions. Charts
  (Sankey, donut) already mix planned and realized; their income leg is a separate row.

## Acceptance criteria

1. Given an active monthly source due this month with no confirmation, then the recap income equals its
   planned amount and « Reste à vivre » = income − charges.
2. Given that source confirmed for the month at another amount, then the confirmed amount is counted,
   never planned + confirmed.
3. Given an inactive source, a source not due, or a confirmation of another month, then it is ignored.
4. Given a prepared month, then the recap shows the same expected income (no more 0).
5. The tile reads « Revenus prévus »; amounts convert to the display currency as today.

## Frame

Standards to read first (CTX-5): none beyond `ARCHITECTURE.md`.

### Replace (stub exists, locked test pins it)

| Path | Role | Exports |
|---|---|---|
| `packages/shared/src/domain/income.ts` | pure rule | keep `ConfirmedIncomeEntry`, `ExpectedIncomeEntry`, `MonthExpectedIncomeResult`; implement `computeMonthExpectedIncome(incomes: Income[], confirmed: ConfirmedIncomeEntry[], monthKey: string, convert?: CurrencyConverter): MonthExpectedIncomeResult`. One entry per source with `isIncomeDueForMonth(income, monthKey)`; `confirmed` match = `incomeId === income.id && budgetMonth === monthKey` (confirmed amount replaces planned); entry `amount`/`currency` stay native; `total` = sum of `convert?.(amount, currency) ?? amount`, rounded to 2 decimals |

### Modify

| Path | Change |
|---|---|
| `apps/web/src/components/budget/steps/recap-step.tsx` | replace the `computeMonthIncome` block (and `incomeEntries`, `accountsById`, `MonthIncomeEntry` import) by `useIncomes({ active: true })` + `computeMonthExpectedIncome(incomes, confirmedEntries, month, convert)`, `confirmedEntries` derived from `useMonthTransactions(month)` (`incomeId`, `budgetMonth`, `amount`); tile label « Revenus prévus »; update the header comment (D1 superseded) |
| `ARCHITECTURE.md` | register `computeMonthExpectedIncome` in the registry; add a Decisions row: recap income = expected income, supersedes archived D1/D8, human decision 2026-11-24 (CTX-3) |

### Read (allow-list)

`ARCHITECTURE.md`, the files above, `apps/web/src/hooks/use-incomes.ts`, `apps/web/src/hooks/use-transactions.ts`.

### Reuse

`isIncomeDueForMonth` (same file), `CurrencyConverter` type, `useIncomes`, `useMonthTransactions`, existing `convert` in the recap. `Transaction.incomeId` / `budgetMonth` already in the schema.

### Style exemplars

`computeMonthIncome` in `packages/shared/src/domain/budget.ts` (JSDoc, `round2`, pure).

### Libraries

None new (date-fns already used by `income.ts`).

### Forbidden

- Any schema change, migration, seed. Editing the locked test.
- Deleting or changing `computeMonthIncome` (kept; its own suite stays green).
- Changing the Sankey/donut/dashboard income leg, or any file not listed.
- Counting one-off positive transactions without `incomeId` in the recap (see Out of scope).

## Tests

### Locked

- `apps/web/__tests__/month-expected-income.test.ts` — 9 tests: no source, planned, not due, inactive,
  confirmed replaces planned, foreign confirmations ignored, mix of sources, conversion + rounding,
  native amounts kept in entries.

Proof of failure: `cd apps/web && npx jest __tests__/month-expected-income.test.ts` → 9 failed
(`not implemented`); `npm run typecheck` clean.

### Proposed by the Executor / Test change requests

| Path | What it covers | Status |
|---|---|---|

## Out of scope

- One-off positive transactions without `incomeId` (e.g. the 4 400 CHF of 2026-11-01): not income of a
  source, ignored by the recap. Open question for the human: should they count?
- Dashboard/Sankey income leg: still realized-only, to review in a new row if wanted.
- `specs/current/monthly-budget/spec.md` update: Advisor at review (SPEC-3).

## Handoffs
- 2026-11-24: `docs/handoffs/20261124-1857-07-budget-remaining-recompute.md`
