---
id: 35-budget-consistency
status: done
branch: feat/35-budget-consistency
tier: medium
locked_at: d63ddcfeff4b16cbacec9ff0f89fb8f3c624ab8c
locked_tests:
  - apps/web/__tests__/scenarios/budget-journey.current.test.ts
  - apps/web/__tests__/due-charges.test.ts
---

# 35 — Budget consistency (provisions, cancelled payments, dues, Sankey = donut = budget)

Master: `specs/SPEC_MASTER.md` · Plan: `docs/plans/20261125-budget-projection-import.md` · Needs: 34 (PR #80, same branch lineage) · Rules: WF-3, WF-7, TEST-1..5

## Summary

- Pourquoi : pour un même mois, le budget, le Sankey et le donut donnent trois totaux de charges différents ; les provisions ignorent leurs dates et la devise, les paiements annulés comptent, les échéances en retard disparaissent des « dues ».
- Ce qui change : un seul total de charges par mois (provision lissée comptée une fois, bornée par `startDate`/`endDate`, convertie en EUR) ; les paiements CANCELLED/FAILED sortent du budget ; une échéance PENDING d'un mois passé reste due.
- Changement de comportement visible : oui (voir Modify, capability specs).

## Acceptance criteria

1. The 7 red tests of `budget-journey.current.test.ts` and the new overdue test of `due-charges.test.ts` pass; the 6 green ones stay green.
2. `npm run test`, `typecheck`, `lint`, `build` green. No locked test edited.
3. App: dashboard Sankey expenses, donut total and budget total of a month are equal (checked on Nov 2026 data).

## Rules pinned (the locked tests constrain them)

- Provision = `round2(Σ convert(amount, currency) / 12)`, **always /12** whatever `type`/`frequency` (TAX 600 gives 50). Convert the sum of raw amounts per charge first (`convert` already rounds to cents), round once: 335 CHF → 351.75 / 12 → 29.31.
- A charge counts in month `M` iff `startDate.slice(0,7) <= M <= endDate.slice(0,7)` (no end = open). Compare `YYYY-MM` strings, never instants (no time-zone question). `M` of a `Date` is `format(month, 'yyyy-MM')` (date-fns, local).
- Dues: PENDING, `dueDate` on or before the end of the month of `today`, charge not provisioned. Later months stay out.
- Sankey: one hop only. A provisioned charge draws no payment link; it adds one link account → its category with its monthly provision, `planned: true`. The locked `expenseTotal` sums every non-account target: no intermediate « Provisions » node.
- Donut: payments of provisioned charges are skipped; each provision is added under its charge's own category (`Assurances = 100`). New optional `monthKey`; absent = every provisioned charge counts (no bounding).

## Frame

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/schedule.ts` | Add `export function isChargeActiveInMonth(charge: Charge, monthKey: string): boolean`. `monthlyProvision(charges: Charge[], month?: Date, convert?: CurrencyConverter): number`: with `month` keeps only active charges; with `convert` converts; without both = today's behaviour (`schedule.test.ts:96-98`, `provisions-card`). `computeMonthlyBudget`: skip CANCELLED/FAILED in `paymentsTotal`, pass `month` and `convert` to `monthlyProvision`. |
| `packages/shared/src/lib/calculation/due-charges.ts` | `computeDueCharges`: replace the `isInMonth` test by « `dueDate` <= end of month of `today` ». Fix the header comment. |
| `packages/shared/src/lib/calculation/sankey.ts` | Section 3: skip payments of provisioned charges; add the provision links (rules above), CHF through `addLink`. |
| `packages/shared/src/lib/calculation/donut.ts` | `computeDonutExpenses` params gain `monthKey?: string`; provision rule above. |
| `apps/web/src/components/dashboard/use-dashboard-data.ts` | Pass `convert` (CHF at `consolidated.rate`, no rate: leave unconverted) to `computeMonthlyBudget` (~l.145); pass `monthKey: selectedMonth` to `computeDonutExpenses` in `buildCharts`. Do **not** touch the dues query (spec 38). |
| `apps/web/src/components/dashboard/dashboard-content.tsx` | Pass `monthKey={selectedMonth}` to `<ProvisionsCard>` (~l.204). Added at review: the prop is required, so the only parent must pass it. |
| `apps/web/src/components/dashboard/cards/provisions-card.tsx` | Filter with `isChargeActiveInMonth` for the selected month (new **required** prop `monthKey: string`); total through `monthlyProvision(charges, month)`. |
| `specs/current/monthly-budget/spec.md`, `specs/current/provisions/spec.md`, `specs/current/dashboard/spec.md` | **Advisor at review (SPEC-2/3)**, not the Executor. |
| `ARCHITECTURE.md` | Registry row for `isChargeActiveInMonth` (CTX-3), same commit. |

### Read (allow-list)

`ARCHITECTURE.md`, the seven files above, `packages/shared/src/domain/conversion.ts`, `apps/web/__tests__/stubs/budget-journey-fixture.ts`, `apps/web/__tests__/scenarios/budget-journey.current.test.ts`, `apps/web/__tests__/due-charges.test.ts`.

### Reuse

`counterValue` and the `CurrencyConverter` type; date-fns `format`; the existing `addLink` of `sankey.ts`. No new date helper.

### Libraries / Forbidden

date-fns only. No new dependency. Forbidden: locked tests, any file not listed, `balance.ts`, any projection code (spec 38), changing `computeMonthlyBudget`/`computeDueCharges`/`computeSankeyFlows` parameter lists beyond what is written above.

## Tests

Locked: both files in the header. Proof of failure at lock `56fad68228c7c780b78269a8f6280e788f75a1d6`: `cd apps/web && npx jest __tests__/scenarios/budget-journey.current.test.ts __tests__/due-charges.test.ts` → 8 failed (7 + the overdue test).

Advisor-modified existing test (already done, before the lock): `due-charges.test.ts` — « ignores payments of other months » split into « later months » + « overdue PENDING stays due ». Checked by grep: no existing Sankey/donut test uses a provisioned charge; `m3-calculations.test.ts:605` feeds `monthlyProvision` without a month (unchanged path).

## Out of scope

Dues for the cursor month and overdue payments query (38). `recap-step.tsx` null rate = 1 (own row). Two « Reste à vivre » labels (38).

## Decisions

- Test change request (Executor, 20261125-1510): `budget-journey.current.test.ts` « draws one realised Sankey leg… » fed provisioned `CHARGES` yet expected 1 link; the pinned rules add provision links. Accepted: the test now passes `charges: []` (income links only). Re-locked at `d63ddcf`.
- Frame gap: `dashboard-content.tsx` added; `monthKey` required.

## Handoffs

- `docs/handoffs/20261125-1437-34-budget-journey-scenarios.md`
