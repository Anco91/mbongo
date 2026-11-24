---
id: 02-query-factories-charges
status: ready
branch: feat/02-query-factories-charges
tier: medium
locked_at: 465cb8d7e5b050f319f8f507b5353f129ce84c67
locked_tests:
  - apps/web/__tests__/query-factories-charges.test.ts
---

# 02 — Query factories: charges, payments

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5, FE-1

## Goal

`chargeQueries` and `paymentQueries` become the only source of query keys and `queryOptions` for
charges and payments; `use-charges.ts` and the payment hooks of `use-schedule.ts` read, prefetch and
invalidate through them. Keys keep their exact current shape.

## Acceptance criteria

1. Given the guards/pages that still hardcode `['charges', {}]`, `['charges', id]`, `['payments', q]`,
   `['payments', id]`, when a hook reads through the factory, then it hits the same cache entry
   (locked test).
2. Given a mutation on charges or payments, when it succeeds, then it invalidates through
   `chargeQueries.all()` / `paymentQueries.all()`, never a string literal.
3. Given `useChargePayments` and `useNextPayment` for the same charge, then both read
   `paymentQueries.byCharge(id)` (one fetch of all its payments); `useNextPayment` only adds
   `select: (payments) => nextPayment(payments, new Date())`. Today both share the key with different
   `queryFn`s (PENDING-only vs all): the cache returned whichever fetched first. `nextPayment` already
   filters PENDING, so the result is unchanged.
4. Given no change to a guard, page, repository or component, when `npx jest` runs in `apps/web`,
   then all existing suites pass unmodified and `npm run typecheck` is clean.
5. `grep -rn "'charges'\|'payments'" apps/web/src/hooks` returns nothing.

## Frame

Standard to read first (CTX-5): `.agents-fw/standards/frontend.md > FE-1` (and FE-11 for mutations).

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/queries/charges.ts` | query factory | `chargeQueries: { all(): readonly ['charges']; list(query: ChargeQuery = {}): queryOptions; detail(id: string): queryOptions }` — keys `['charges', query]`, `['charges', id]`; `queryFn` = `chargesRepository.findMany(query)` / `.findOne(id)`; `detail` has `enabled: Boolean(id)` |
| `apps/web/src/queries/payments.ts` | query factory | `paymentQueries: { all(): readonly ['payments']; list(query: PaymentQuery = {}): queryOptions; detail(id: string): queryOptions; byCharge(chargeId: string): queryOptions }` — keys `['payments', query]`, `['payments', id]`, `['payments', { chargeId }]`; `byCharge` queryFn = `paymentsRepository.findMany({ chargeId: { eq: chargeId } })`, `enabled: Boolean(chargeId)`; `detail` `enabled: Boolean(id)` |

Both files exist as stubs (throwing `not implemented`, with a `QueryStub` type): replace them
entirely. Copy `apps/web/src/queries/accounts.ts` (module-level `const KEY = '…' as const`, no
self-reference in the initializer).

### Modify

| Path | Change |
|---|---|
| `apps/web/src/hooks/use-charges.ts` | `useCharges` → `useQuery(chargeQueries.list(query))`; `useCharge` → `.detail(id)`; `useChargePayments` → `useQuery(paymentQueries.byCharge(id))`; `useNextPayment` → `useQuery({ ...paymentQueries.byCharge(id), select })` (criterion 3); all invalidations → `chargeQueries.all()` / `paymentQueries.all()`; `removeQueries` → `chargeQueries.detail(id).queryKey`; the three `prefetch*` helpers → `queryClient.prefetchQuery(<factory>)` (keep names, signatures and the `if (!id) return`); drop `CHARGE_KEY`, `chargeKey`, `chargePaymentsKey` and the closing export line (no consumer outside this file) |
| `apps/web/src/hooks/use-schedule.ts` | `usePayments` → `paymentQueries.list(query)`; `useMonthPayments` → `paymentQueries.list(query)` (keeps `monthPaymentsQuery` + `useMemo`); `usePayment` → `paymentQueries.detail(id)`; invalidations → `paymentQueries.all()`; drop `PAYMENTS_KEY` |
| `ARCHITECTURE.md` | Module map and Registry line for `queries/`: add `chargeQueries`, `paymentQueries`; Debt FE-1 row: charges, payments done in 02 |

### Read (allow-list)

- `ARCHITECTURE.md`, `.agents-fw/standards/frontend.md` (FE-1, FE-11 only)
- `apps/web/src/queries/accounts.ts` (exemplar), `apps/web/src/hooks/use-charges.ts`, `use-schedule.ts`
- `apps/web/src/repositories/{charges,payments}.repository.ts` (signatures only)
- `apps/web/src/lib/month-queries.ts`

### Reuse (from the registry)

- `apps/web/src/repositories/` — `queryFn` delegates to existing repositories, no new fetch code.
- `apps/web/src/lib/month-queries.ts` — month windows stay built there; the factory takes the query.
- `packages/shared` `ChargeQuery`, `PaymentQuery`, `nextPayment` — never redeclare.

### Style exemplars

- `apps/web/src/queries/accounts.ts` — header, `KEY` constant, factory shape (ROLE-10).

### Libraries

- `@tanstack/react-query` v5 — `queryOptions`. No new dependency.

### Forbidden

- Any file not listed above, in particular guards, pages, components, repositories, `use-incomes.ts`.
- Editing `apps/web/__tests__/query-factories-charges.test.ts` (locked). Existing tests unmodified.
- Changing any key shape (prefix, wrapping in an object): guards keep hardcoding them until 04.
- `useEffect`, a global key registry, a barrel `queries/index.ts`.
- Touching the `use-schedule.ts` `useTransactions` hook or the `transactionQueries` calls (slice 01).

## Tests

### Locked (written by the Advisor, failing before execution)

- `apps/web/__tests__/query-factories-charges.test.ts` — exact key shapes, `enabled` on detail/byCharge, resource prefixes, month-window key.

Proof of failure: `cd apps/web && npx jest __tests__/query-factories-charges.test.ts` → `Tests: 9 failed, 9 total` (`not implemented`).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- Factories for incomes, transfers, monthly budgets, alerts, balances, exchange-rate (slice 03).
- Guards and pages using the factories, generic Guard (slice 04); list query (slice 05).

## Handoffs

