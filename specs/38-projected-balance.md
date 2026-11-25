---
id: 38-projected-balance
status: ready
branch: feat/38-projected-balance
tier: medium
locked_at: 56fad68228c7c780b78269a8f6280e788f75a1d6
locked_tests:
  - apps/web/__tests__/scenarios/budget-journey.projection.test.ts
---

# 38 — Projected balance (patrimoine à la fin d'un mois)

Master: `specs/SPEC_MASTER.md` · Plan: `docs/plans/20261125-budget-projection-import.md` (D2-D6) · Needs: 35 · Rules: WF-3, WF-7, TEST-1..5

## Summary

- Pourquoi : le patrimoine ignore le mois choisi et compte les opérations futures dans le solde du jour ; aucune vue du « combien aurai-je fin décembre ».
- Ce qui change : le solde du jour est borné à aujourd'hui ; la carte patrimoine suit le curseur de mois : réel pour un mois passé, « Projeté fin <mois> » sinon ; « Reste à vivre » a deux libellés distincts ; les dues incluent les retards.
- Changement de comportement visible : oui.

## Acceptance criteria

1. `budget-journey.projection.test.ts` passes (17 tests; numbers hand-checked in its header).
2. Full suite, typecheck, lint, build green.
3. App: on December the wealth card reads « Projeté fin décembre » with the figure of the test table; today's wealth does not move when a future-dated transaction is added.

## Rules pinned

- `balanceAsOf(account, transactions, asOf)`: `openingBalance` + the account's transactions whose UTC day (`date.slice(0,10)`) <= the UTC day of `asOf`; cent-rounded, no `-0`. `computeStatementGap` calls it (no second copy).
- `computeMonthState(monthKey, today)`: compares with `today.toISOString().slice(0,7)`.
- `computeProjectedBalance`: ACTIVE accounts only. Past month: `balanceAsOf` at the last day of the month. Current/future: `balanceAsOf(today)` + flows after today up to the end of `monthKey`:
  1. transactions dated after today's day (covers confirmed future income, SOURCE legs, paid-ahead debits);
  2. each month from today's month to `monthKey`: due incomes not confirmed (`computeMonthExpectedIncome`, entries with `confirmed: false`) at planned amount on the income's account; a confirmed income is a transaction, never planned again (D6); past months contribute nothing;
  3. PENDING payments with `dueDate` <= end of `monthKey`, overdue included, **provisioned included** (cash leaves at the real date, D5), -amount on the charge's account; PAID/CANCELLED/FAILED never;
  4. each ESTIMATED transfer without a TARGET transaction: + expected amount on the target account (`transferLegAmount(tr, srcCur, tgtCur, tr.rateEstimated)`, exported from `sankey.ts`) when `sentAt` <= end of `monthKey`;
  5. each CREDIT_CARD account with `linkedAccountId`: `cardBilling(card, its transactions, today)`; if `nextBillingDate` <= end of `monthKey` and `encours` > 0: card +encours, linked account -encours (only the next cycle; deferred cards settle themselves: no move).
  Flows on non-active accounts are dropped. `totalEur` = `computeConsolidatedBalance(accounts, balances, [], rate ? {rate, rateDate: today ISO} : null).totalEur`.
- Labels (`docs/LEXIQUE.md`): « Reste à vivre (budget) » = revenus - charges du mois (recap); « Reste à vivre (comptes) » = soldes hors épargne - dues; « Projeté fin <mois> ».

## Frame

### Create

| Path | Role |
|---|---|
| `packages/shared/src/lib/calculation/projected-balance.ts` | **Advisor stub exists** (types + throwing functions, barrel line in `index.ts` done). Executor replaces the bodies, keeps the exported types and signatures. |
| `apps/web/src/queries/payments.ts` (extend `paymentQueries`) | `paymentQueries.pendingUntil(monthKey)`: PENDING payments with `dueDate` <= end of month, `queryOptions` factory (FE-1). Executor mirrors the existing month window factory in `lib/month-queries.ts`. |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/balance.ts` | Replace the `balanceAsOf` stub body; `computeStatementGap` uses it. |
| `packages/shared/src/lib/calculation/sankey.ts` | `export` `transferLegAmount` (no other change). |
| `apps/web/src/components/dashboard/use-dashboard-data.ts` | `balances` via `balanceAsOf(today)`; expose `projection` (`computeProjectedBalance` for `selectedMonth`); dues from `pendingUntil(current month)` through `computeDueCharges`. |
| `apps/web/src/components/dashboard/dashboard-guard.tsx` | Prefetch the `pendingUntil` entry under the same key. |
| `apps/web/src/components/dashboard/cards/wealth-card.tsx` | Show `projection.totalEur`; label « Projeté fin <mois> » when the state is `current` or `future`, no label for `past`; rename the two « Reste à vivre ». |
| `docs/LEXIQUE.md`, `specs/current/{dashboard,monthly-budget}/spec.md` | LEXIQUE by the Executor; capability specs by the **Advisor at review**. `dashboard/spec.md:207` (« patrimoine ignore le mois ») must be reversed. |
| `apps/web/src/components/dashboard/dashboard-content.tsx` | Frame amended at execution (PM): destructure `projection` from `useDashboardData`, pass `projection` and `selectedMonth` to `<WealthCard>`. |
| `apps/web/src/components/budget/steps/recap-step.tsx` | Frame amended at execution (PM): line 110 label « Reste à vivre » becomes « Reste à vivre (budget) ». |
| `ARCHITECTURE.md` | Registry rows for `balanceAsOf`, `computeProjectedBalance`, `computeMonthState`, `paymentQueries.pendingUntil`. |

### Read (allow-list)

`ARCHITECTURE.md`, the files above, `packages/shared/src/domain/{card-billing,schedule}.ts`, `lib/calculation/consolidated.ts`, `apps/web/src/lib/month-queries.ts`, `apps/web/src/queries/payments.ts`, the projection test and fixture.

### Reuse / Libraries / Forbidden

Reuse `computeMonthExpectedIncome`, `computeConsolidatedBalance`, `cardBilling`, `counterValue`, `isIncomeDueForMonth`. date-fns and TanStack Query only. Forbidden: locked test and fixture, files not listed, `useEffect`, re-deriving the consolidation, writing to the database. Standard: `frontend.md > queryOptions factory`.
Size: 7 production files + stub: at the limit, accepted.

## Tests

Locked: `apps/web/__tests__/scenarios/budget-journey.projection.test.ts` (fixture additions appended to `stubs/budget-journey-fixture.ts`, same lock commit). Proof of failure at `56fad68228c7c780b78269a8f6280e788f75a1d6`: `cd apps/web && npx jest __tests__/scenarios/budget-journey.projection.test.ts` → 17 failed (stubs throw).

## Out of scope

Rates other than the current one (flagged, not modelled); card cycles after the next one; schedule generation of future payments (only existing payments are projected, January has none in the fixture).

## Handoffs

- `docs/handoffs/20261125-1437-34-budget-journey-scenarios.md`
