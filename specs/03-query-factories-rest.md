---
id: 03-query-factories-rest
status: review
branch: feat/03-query-factories-rest
tier: medium
locked_at: 2196408dfd09928d4bbf84bf573cd91d7ddcffc5
locked_tests:
  - apps/web/__tests__/query-factories-rest.test.ts
---

# 03 — Query factories: incomes, transfers, monthly budgets, exchange rate

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5, FE-1

## Goal

`incomeQueries`, `transferQueries`, `monthlyBudgetQueries` and `exchangeRateQueries` become the only
source of query keys and `queryOptions` for these resources; their hooks read and invalidate through
them. Keys keep their exact current shape. Closes the FE-1 debt except hooks without a key.

Scope note: `use-alerts.ts` and `use-balances.ts` own no query key (they derive from the accounts,
charges, payments and transactions hooks). Nothing to factor; the master row is corrected.

## Acceptance criteria

1. Given the budget page and guards that hardcode `['incomes', { month }]`, `['monthly-budgets', mois]`,
   `['transfers', query]`, when a hook reads through the factory, then it hits the same cache entry
   (locked test).
2. Given a mutation on incomes, transfers or monthly budgets, when it succeeds, then it invalidates
   through `incomeQueries.all()` / `.detail(id).queryKey` / `transferQueries.all()` /
   `monthlyBudgetQueries.detail(month).queryKey`, never a string literal.
3. Given `useExchangeRate`, then the live query is `useQuery(exchangeRateQueries.latest())` with the
   same fetch, 12 h `staleTime` and `retry: 1` as today; `resolveRate` and the returned state are untouched.
4. Given no change to a guard, page, repository or component, when `npx jest` runs in `apps/web`,
   then all existing suites pass unmodified and `npm run typecheck` is clean.
5. `grep -rn "'incomes'\|'transfers'\|'monthly-budgets'\|'exchange-rate'" apps/web/src/hooks` returns nothing.

## Frame

Standard to read first (CTX-5): `.agents-fw/standards/frontend.md > FE-1` (and FE-11 for mutations).

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/queries/incomes.ts` | query factory | `incomeQueries: { all(): readonly ['incomes']; list(query: IncomeQuery = {}): queryOptions; detail(id: string): queryOptions }` — keys `['incomes', query]`, `['incomes', id]`; `list` queryFn = `incomesRepository.findMany(query)`; `detail` queryFn = the current `useIncome` body (`findMany({})`, `find` by id, throw `Income ${id} not found`), `enabled: Boolean(id)` |
| `apps/web/src/queries/transfers.ts` | query factory | `transferQueries: { all(): readonly ['transfers']; list(query: TransferQuery = {}): queryOptions }` — key `['transfers', query]`; queryFn = `transfersRepository.findMany(query)` |
| `apps/web/src/queries/monthly-budgets.ts` | query factory | `monthlyBudgetQueries: { all(): readonly ['monthly-budgets']; detail(month: string): queryOptions }` — key `['monthly-budgets', month]`; queryFn = `monthlyBudgetsRepository.findOne(month)`; `enabled: Boolean(month)` |
| `apps/web/src/queries/exchange-rate.ts` | query factory | `exchangeRateQueries: { all(): readonly ['exchange-rate']; latest(): queryOptions }` — key `['exchange-rate']`; queryFn, `staleTime` (`STALE_TIME_12H`, module constant) and `retry: 1` moved verbatim from `useExchangeRate` |

All four exist as stubs (throwing `not implemented`, with a `QueryStub` type): replace them entirely.
Copy `apps/web/src/queries/accounts.ts` (module-level `const KEY = '…' as const`).

### Modify

| Path | Change |
|---|---|
| `apps/web/src/hooks/use-incomes.ts` | `useIncomes` → `useQuery(incomeQueries.list(query))`; `useIncome` → `.detail(id)`; invalidations → `incomeQueries.all()` and `incomeQueries.detail(id).queryKey`; keep `transactionQueries.all()` and the `['dashboard']` literal (no dashboard factory yet); drop `INCOME_KEY`, `incomeKey` |
| `apps/web/src/hooks/use-transfers.ts` | `useTransfers` → `transferQueries.list(query)`; invalidations → `transferQueries.all()`; drop `TRANSFERS_KEY` |
| `apps/web/src/hooks/use-monthly-budget.ts` | `useMonthlyBudget` → `monthlyBudgetQueries.detail(month)`; invalidation → `monthlyBudgetQueries.detail(month).queryKey`; keep the `['dashboard']` literal; drop `MONTHLY_BUDGET_KEY`, `monthlyBudgetKey` |
| `apps/web/src/hooks/use-exchange-rate.ts` | live query → `useQuery(exchangeRateQueries.latest())`; drop the inline fetch and `STALE_TIME_12H`; rest unchanged |
| `ARCHITECTURE.md` | Module map and Registry line for `queries/`: add the four factories; Debt FE-1 row: incomes, transfers, monthly budgets, exchange-rate done in 03; alerts and balances have no key |
| `specs/SPEC_MASTER.md` | Row 03 outcome: drop alerts and balances (no query key) |

### Read (allow-list)

- `ARCHITECTURE.md`, `.agents-fw/standards/frontend.md` (FE-1, FE-11 only)
- `apps/web/src/queries/accounts.ts` (exemplar), the four hooks above
- `apps/web/src/repositories/{incomes,transfers,monthly-budgets}.repository.ts` (signatures only)

### Reuse (from the registry)

- `apps/web/src/repositories/` — `queryFn` delegates to existing repositories, no new fetch code.
- `apps/web/src/queries/transactions.ts` — `transactionQueries.all()` stays the invalidation target for transactions.
- `packages/shared` `IncomeQuery`, `TransferQuery`, `resolveRate` — never redeclare.

### Style exemplars

- `apps/web/src/queries/accounts.ts` — header, `KEY` constant, factory shape (ROLE-10).

### Libraries

- `@tanstack/react-query` v5 — `queryOptions`. No new dependency.

### Forbidden

- Any file not listed above, in particular guards, pages, components, repositories, `use-alerts.ts`, `use-balances.ts`.
- Editing `apps/web/__tests__/query-factories-rest.test.ts` (locked). Existing tests unmodified.
- Changing any key shape: guards keep hardcoding them until 04.
- A new `detail` on `transferQueries` or a dashboard factory (no consumer: YAGNI).
- `useEffect`, a global key registry, a barrel `queries/index.ts`.

## Tests

### Locked (written by the Advisor, failing before execution)

- `apps/web/__tests__/query-factories-rest.test.ts` — exact key shapes, `enabled` on detail, resource prefixes, 12 h cache and single retry of the exchange rate.

Proof of failure: `cd apps/web && npx jest __tests__/query-factories-rest.test.ts` → `Tests: 12 failed, 12 total` (`not implemented`).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- Guards and pages using the factories, generic Guard (slice 04); list query (slice 05).
- A `dashboardQueries` factory (the `['dashboard']` invalidations stay literals).

## Handoffs

