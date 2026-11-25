---
id: due-charges-net-worth
status: ready
branch: feat/due-charges-net-worth
tier: medium
locked_at: 48f9302
locked_tests:
  - apps/web/__tests__/due-charges.test.ts
  - apps/web/__tests__/remaining-to-live.test.ts
---

# Frame — due-charges-net-worth (master row 30)

OpenSpec change `openspec/changes/due-charges-net-worth/`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5.

## Summary

Net worth ignores charges due this month and not yet debited. The wealth card now shows the due charges, the net total and a « Reste à vivre (comptes) » figure. No schema change.

## Frame

### Create (stubs already exist, replace the bodies)

| Path | Role | Exports |
|---|---|---|
| `packages/shared/src/lib/calculation/due-charges.ts` | pure | `computeDueCharges(payments: Payment[], charges: Charge[], today: Date, rate: number \| null): number \| null`, `computeNetOfDue(consolidated: ConsolidatedBalance, dueEur: number \| null): number \| null` |
| `packages/shared/src/lib/calculation/remaining-to-live.ts` | pure | `computeRemainingToLive(accounts: Account[], balances: Record<string, number>, dueEur: number \| null, rate: number \| null): number \| null` |

Rules: EUR result, 2-decimal rounding; `PENDING` payments with `dueDate` in the month of `today` (use `monthRange`/`isInMonth`); skip payments whose charge is `provisioned`; CHF converted with `counterValue(amount, rate)`, `null` result when a CHF amount needs a missing rate; remaining = `ACTIVE` accounts except `SAVINGS`, balance `balances[id] ?? openingBalance ?? 0`.

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/index.ts` | already exports both files (done by Advisor) |
| `apps/web/src/components/dashboard/use-dashboard-data.ts` | call `useMonthPayments(currentMonthKey())` (import from `@/lib/month-navigation`); expose `dueChargesEur`, `netOfDueEur`, `remainingToLiveEur` (`number \| null`) in `DashboardData` |
| `apps/web/src/components/dashboard/cards/wealth-card.tsx` | props `dueChargesEur`, `netOfDueEur`, `remainingToLiveEur`; under the gross total: « dont charges dues », net total, « Reste à vivre (comptes) »; hide a line when its value is null or due is 0; format with `formatAmount(convert(x), displayCurrency)` |
| `apps/web/src/components/dashboard/dashboard-content.tsx` | pass the three values to `WealthCard` |
| `docs/LEXIQUE.md` | entry « Reste à vivre (comptes) » vs budget recap « Reste à vivre » |
| `ARCHITECTURE.md` | registry rows for the two new files |

### Read (allow-list)

`ARCHITECTURE.md`, the files above, `packages/shared/src/lib/calculation/consolidated.ts`, `apps/web/src/hooks/use-schedule.ts`, `apps/web/src/lib/month-navigation.ts`.

### Reuse

`counterValue` (domain/conversion), `monthRange`/`isInMonth` (calculation/month), `useDisplayCurrency().convert`, `formatAmount`.

### Style exemplars

`packages/shared/src/lib/calculation/consolidated.ts` (pure calc), `apps/web/src/components/dashboard/cards/wealth-card.tsx`.

### Forbidden

Any other file; new dependency; `useEffect`; UI tests; editing locked tests; Prisma or schema changes; `consolidated.ts` edits.
Checks: `npm run test`, `typecheck`, `lint`, `build`.

## Tests

### Locked

- `apps/web/__tests__/due-charges.test.ts`, `apps/web/__tests__/remaining-to-live.test.ts`

Proof of failure: `cd apps/web && npx jest due-charges remaining-to-live` → 21 failed (`not implemented`).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Handoffs
