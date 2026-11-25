---
id: 53-budget-day-balances
status: done
branch: test/53-budget-day-balances
tier: small
locked_at: 4d75460d74a0712c8d15aed63efb163e95777ad5
locked_tests:
  - apps/web/__tests__/scenarios/budget-day-balances.test.ts
---

# 53 — Budget day-by-day balance scenarios (no UI, no production code)

Master: `specs/SPEC_MASTER.md` row 52 · Rules: WF-3, TEST-1..5

## Summary

- Pourquoi : les scénarios existants prouvent les totaux par mois, pas le jour exact où un achat ou un prélèvement baisse un solde.
- Ce qui change : un test de scénario, petit foyer calculé à la main (aujourd'hui 2026-11-15). Aucun code de production.
- Aucun changement de comportement.

## Audit of existing scenario tests

| File | Already asserts |
|---|---|
| `budget-journey.current.test.ts` | monthly charges total (provision vs payments), next month from the schedule alone, early confirmed salary, start/end bounds, due charges, same total across Sankey/donut |
| `budget-journey.projection.test.ts` | balance today, end of current/future/past month, overdue, payment paid once, CHF transfer, credit card settlement, deferred card total (-100, no move), closed account |
| `budget-journey.start-balance.test.ts` | saved start balance anchoring, flows counted once |
| `budget-coherence*.test.ts` | future month = budget only, no carry-over between months, one number per month, closed accounts out |
| `month-journey.test.ts` | prepared month X, X+1, X+2, deferred overdraft not carried |

Row 52 « mois suivant sans report » is already covered by `budget-coherence.test.ts` (no carry-over). Not repeated.

## Acceptance criteria (all green today, they lock behaviour)

1. Current month: S 1000 + X 2000 − Y (800 + 100) = Z 2100, same result from the real path and anchored on the saved start; today 2200.
2. Deferred card: -100 the day before, -150 on the day of the purchase (any hour), -220 at end of month; linked account untouched, total 1880; no debit on the account in December.
3. Direct debit: counted today at any hour of the day; dated tomorrow it is left out today and counted at month end; a PAID payment with its transaction is counted once.

## Frame

Create (Advisor, done): `apps/web/__tests__/scenarios/budget-day-balances.test.ts`, reuses `stubs/budget-journey-fixture.ts` shapes. Executor: none. Forbidden: production code, other tests.

## Tests

### Locked

- `apps/web/__tests__/scenarios/budget-day-balances.test.ts`
