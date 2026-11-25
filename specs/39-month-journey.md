---
id: 39-month-journey
status: ready
branch: feat/39-month-journey
tier: medium
locked_at: d5a53b5781c616eccbbf3f3b4f16ed72674917f4
locked_tests:
  - apps/web/__tests__/scenarios/month-journey.test.ts
---

# 39 — Month journey (budgéter X, puis X+1 et X+2)

Master: `specs/SPEC_MASTER.md` · Plan: `~/.claude/plans/etant-donn-e-que-c-est-pure-deer-of-9a2ed560-ac47-4366-8cef-49dcffc73cfa.md` · Needs: 35, 38 · Rules: WF-3, WF-7, TEST-1..5

## Summary

- Pourquoi : le parcours central (préparer un mois, puis le suivant sans rien ressaisir) n'avait aucun test ; les mois sans échéance enregistrée paraissaient vides.
- Ce qui change : une fonction pure donne le plan d'un mois préparé en début de mois (échéances attendues, totaux, solde logique de départ par compte) ; fixes sans fin repris, ponctuelle et charge terminée absentes, découvert d'un compte à débit différé non reporté.
- Changement de comportement visible : non dans cette spec (domaine pur ; branchement dans les lignes 40 à 42).

## Acceptance criteria

1. `month-journey.test.ts` passes (13 tests; numbers hand-checked in its header).
2. Full suite, typecheck, lint, build green; `ARCHITECTURE.md` registers the new exports.

## Rules pinned

- `expectedMonthPayments(charges, payments, monthKey)`: persisted payments of the month (any status) + scheduled ones not persisted. Scheduled = `missingPayments(charge, persistedOfThatCharge, firstDayOfMonth)` kept when `dueDate.slice(0,7) === monthKey`. No new generator.
- Persisted and scheduled match on `dueDate.slice(0,10)` (scheduled dates are UTC midnight, persisted ones may be noon: matching on the instant would duplicate the rent, checked). A persisted CANCELLED/FAILED payment still counts as persisted.
- Scheduled payment: `id = expected:<chargeId>:<YYYY-MM-DD>`, status PENDING, `paidAt`/`transactionId` null, `createdAt = updatedAt = dueDate`.
- Do **not** filter charges with `isChargeActiveInMonth` for payments: an open-ended `ONE_OFF` would come back every month. `ONE_OFF` yields one payment at `startDate`, which leaves the month filter.
- `computeMonthPlan`: `chargesTotal = computeMonthlyBudget(charges, expectedPayments, firstDayOfMonth, convert).total`; `incomeTotal = computeMonthExpectedIncome(incomes, confirmedIncome, monthKey, convert).total`; `remaining = round2(income - charges)`.
- `suggestMonthStart`: ACTIVE accounts only; previous end balance carried; `deferredCard` account ending negative → 0 (repaid at month end, human decision 2026-11-25); missing or `previousEnd` null → `openingBalance`. `startBalances` = `startOverrides[id] ?? suggestion` (an override may be negative).
- Consistent with spec 38: deferred accounts settle themselves in `computeProjectedBalance` (no move); this spec only sets the next month's *start*.

## Frame

### Create

| Path | Role |
|---|---|
| `packages/shared/src/lib/calculation/month-journey.ts` | **Advisor stub exists** (types, throwing bodies, barrel line in `index.ts` done). Executor replaces the bodies, keeps exported types and signatures. |

### Modify

| Path | Change |
|---|---|
| `ARCHITECTURE.md` | Registry row for `expectedMonthPayments`, `suggestMonthStart`, `computeMonthPlan`. |
| `specs/current/monthly-budget/spec.md` | **Advisor at review**: requirements + scenarios (SPEC-2, SPEC-3). Executor never edits it. |

### Read (allow-list)

`ARCHITECTURE.md`, `packages/shared/src/domain/{schedule,income}.ts`, `packages/shared/src/lib/calculation/month-journey.ts`, the test and fixture.

### Reuse / Libraries / Forbidden

Reuse `missingPayments`, `computeMonthlyBudget`, `computeMonthExpectedIncome`, `round2`. date-fns only. Forbidden: locked test and fixture (`stubs/month-journey-fixture.ts`, and the spec 34/38 fixture), files not listed, Prisma, hooks, UI, `useEffect`, writing to the database or to `dev.db`.
Size: 1 production file.

## Tests

Locked: `apps/web/__tests__/scenarios/month-journey.test.ts`. Proof of failure at `d5a53b5781c616eccbbf3f3b4f16ed72674917f4`: `cd apps/web && npx jest __tests__/scenarios/month-journey.test.ts` → 13 failed, all `not implemented: …`. Reference check (throwaway): `missingPayments` over the fixture gives Dec rent+ins+TV+gym, Jan/Feb rent+ins.

## Out of scope (own rows in the master)

- 40: persist the logical start balance per month and the accounts step; needs a Prisma migration: **human gate (GIT-7)**. Not a `BalanceSnapshot` (it would zero `computeStatementGap`).
- 41: wealth card lines (dues, net worth, reste à vivre) follow the cursor or read « aujourd'hui »; check `/budget/2026-12` prepares end to end in the app.
- 42: budget card shows « CHF » next to a EUR total (`budget-preparation-card.tsx:96`); fast-track.
- Data, not code: `Grady - BNP` is not flagged `deferredCard` (to set in the app).
- CSV import and external transfers: rows 36, 37, parked.

## Handoffs

- `docs/handoffs/20261125-1700-38-projected-balance.md`
- `docs/handoffs/20261125-1944-39-month-journey.md`
