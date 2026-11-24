---
id: 12-sankey-income-leg
status: ready
branch: feat/12-sankey-income-leg
tier: medium
locked_at: 86d8502
locked_tests:
  - apps/web/__tests__/sankey-income-leg.test.ts
  - apps/web/__tests__/m3-calculations.test.ts
---

# 12 — Sankey income leg on expected income

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5

## Summary

Le Sankey du dashboard construit ses revenus depuis les seules transactions positives du mois : un mois avec un salaire attendu mais non confirmé n'a aucune entrée, comme le recap du budget avant la spec 07. Le Sankey part maintenant des revenus attendus (montant confirmé s'il existe, sinon prévu), avec les revenus non confirmés dessinés comme flux « prévus », comme les charges à venir. Une transaction positive sans lien à une source n'y figure plus tant qu'elle n'est pas rapprochée (décision comptable, spec 14). Comportement visible modifié.

## Goal

The Sankey income leg = `computeMonthExpectedIncome` entries: source label → account, confirmed
entries realized, unconfirmed entries `planned: true`. Planned links stop rendering as stripes.

## Diagnosis

- `sankey.ts` step 1 sums every positive, non-transfer transaction. A due source with no confirmation
  gives no link; a one-off positive (dev.db: 4 400 CHF, no `incomeId`) gives a link no source explains.
- Option 2 (`ARCHITECTURE.md` Decisions, 2026-11-24): an unmatched positive is never counted before it is
  matched, so it leaves this leg until spec 14 proposes the match. A transfer TARGET leg has `transferId`
  and stays excluded.
- Stripes (UNVERIFIED, hypothesis): `renderSankeyLink` draws planned links with
  `strokeDasharray="6 4"`. On a stroke as wide as the link band, a dash pattern shows as bars across the
  band. Fix chosen: no dash array; planned = opacity 0.25 vs 0.5 for realized. The human checks it on
  screen after the PR.

## Acceptance criteria

1. Given an active monthly source due in the month with no confirmation, then there is one link
   source label → account with `planned: true`, value = planned amount converted to EUR.
2. Given that source confirmed for the month (transaction with `incomeId` + `budgetMonth`), then one link,
   `planned` absent, at the confirmed amount; never planned + confirmed.
3. Given a positive transaction with neither `transferId` nor `incomeId`, then it produces no income link.
4. Given a source on a closed account and `showClosed` false, then its link is absent (like the rest).
5. Given an inactive source, a source not due, or a confirmation of another month, then no link.
6. Planned income and planned charge links share one rendering: no dash array, lower opacity.

## Frame

Standards to read first (CTX-5): none beyond `ARCHITECTURE.md`.

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/lib/calculation/sankey.ts` | `computeSankeyFlows` params gain `incomes: Income[]` and `monthKey: string`. Replace step 1 by: `computeMonthExpectedIncome(incomes, confirmed, monthKey)` entries → `addLink(income.label, account name, entry.amount, entry.currency, !entry.confirmed)`. `confirmed` is built from `transactions` as in `recap-step.tsx` (`incomeId`, `budgetMonth`, `amount`). Transactions steps 4 stay |
| `packages/shared/src/lib/calculation/active-accounts.ts` | `excludeClosedAccounts` also filters an optional `incomes` array on `accountId`; return shape keeps `incomes` |
| `apps/web/src/components/dashboard/use-dashboard-data.ts` | `useIncomes()`; pass `incomes` and `selectedMonth` to `excludeClosedAccounts` / `computeSankeyFlows`. Confirmed entries come from ALL transactions, not `monthTransactions` (the match is on `budgetMonth`) |
| `apps/web/src/components/charts/sankey-flows-chart.tsx` | `renderSankeyLink`: drop `strokeDasharray`; `strokeOpacity` 0.25 planned, 0.5 realized |
| `specs/current/dashboard/spec.md` | NOT by the Executor (SPEC-2); the Advisor updates it at review |

### Read (allow-list)

- `ARCHITECTURE.md`
- the four files above
- `packages/shared/src/domain/income.ts` (types and `computeMonthExpectedIncome` only)
- `apps/web/src/components/budget/steps/recap-step.tsx` lines 55-75 (the `confirmedEntries` mapping to copy)
- `apps/web/__tests__/m3-calculations.test.ts` lines 266-420, 820-870 (sankey tests; the Advisor edits them)

### Reuse (from the registry)

- `computeMonthExpectedIncome` — expected-income rule, already tested.
- `excludeClosedAccounts` — closed-account scope.
- `useIncomes` (`apps/web/src/hooks/use-incomes.ts`) — incomes query, uses `incomeQueries`.

### Libraries

- None new.

### Forbidden

- Any file not listed. No change to `computeMonthExpectedIncome`, the recap, or `sankeyNodeTotals`.
- No hardcoded query key; no `useEffect`; no new date helper.
- No heuristic matching of unmatched positives: that is spec 14.
- Editing locked tests.

## Tests

Locked at 86d8502 (Advisor). Criteria 1-5 are pinned; criterion 6 is a visual check by the human (TEST-2).
`m3-calculations.test.ts`: the first sankey case now takes its income from a source, and every
`computeSankeyFlows` call passes `incomes` and `monthKey`.

### Locked

- `apps/web/__tests__/sankey-income-leg.test.ts` (new): criteria 1-5 and the `excludeClosedAccounts` incomes filter.
- `apps/web/__tests__/m3-calculations.test.ts` (edited): sankey cases moved onto `incomes` + `monthKey`.

Stubs already in place (86d8502), the Executor completes them: `incomes` and `monthKey` in the
`computeSankeyFlows` params, optional `incomes` in `AccountScopedData`. Logic is not implemented.
`use-dashboard-data.ts` does not typecheck until the Executor passes `incomes` and `monthKey`.
`@mbongo/shared` is read through `dist`: run `npm run build -w packages/shared` before `jest`.

### Proof of failure

`npm run build -w packages/shared && cd apps/web && npx jest sankey-income-leg m3-calculations exclude-closed-accounts`

```
Tests: 8 failed, 39 passed
✕ draws a due unconfirmed source as a planned link ... (expected 1 link, received 0)
✕ ignores a positive transaction with neither transferId nor incomeId (received a 2200 link)
✕ drops the sources pointing at a closed account
✕ constructs incomes, transfers, and expense links (salary source gives no link)
```

All failures are assertion failures on the missing behaviour, none is a load or type error.

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- Showing unmatched positives (spec 14), transfer leg checks (15), net-worth hover (08).
- Changing the donut or the recap.

## Handoffs

- `docs/handoffs/20261124-1932-12-sankey-income-leg.md`
