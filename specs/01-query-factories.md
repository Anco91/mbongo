---
id: 01-query-factories
status: ready
branch: feat/01-query-factories
tier: medium
locked_at: 357a27e36f95c9b98368a9e75dc12e4828ad2ffb
locked_tests:
  - apps/web/__tests__/query-factories.test.ts
---

# 01 — Query factories: members, accounts, transactions

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5, FE-1

## Goal

Pilot of FE-1: `memberQueries`, `accountQueries`, `transactionQueries` become the only source of
query keys and `queryOptions` for these three resources; their hooks (and the duplicate transactions
hook in `use-schedule.ts`) read and invalidate through them. Keys keep their exact current shape.

## Acceptance criteria

1. Given the guards/pages that still hardcode `['accounts', {}]`, `['members']`, `['transactions', q]`,
   when a hook reads through the factory, then it hits the same cache entry (locked test).
2. Given a mutation of members, accounts or incomes-independent code in these hooks, when it
   succeeds, then it invalidates through `<resource>Queries.all()`, never a string literal.
3. Given no change to a guard, page, repository or component, when `npx jest` runs in `apps/web`,
   then the 72 existing suites still pass and `npm run typecheck` is clean.
4. `grep -rn "'members'\|'accounts'\|'transactions'" apps/web/src/hooks` returns nothing.

## Frame

Standard to read first (CTX-5): `.agents-fw/standards/frontend.md > FE-1` and
`.agents-fw/standards/reference/frontend.md` (query factory example, if present).

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/queries/members.ts` | query factory | `memberQueries: { all(): readonly ['members']; list(): queryOptions }` — key `['members']`, `queryFn` = `membersRepository.findMany()` |
| `apps/web/src/queries/accounts.ts` | query factory | `accountQueries: { all(): readonly ['accounts']; list(query: AccountQuery = {}): queryOptions; detail(id: string): queryOptions }` — keys `['accounts', query]`, `['accounts', id]`; `detail` has `enabled: Boolean(id)` |
| `apps/web/src/queries/transactions.ts` | query factory | `transactionQueries: { all(): readonly ['transactions']; list(query: TransactionQuery = {}): queryOptions }` — key `['transactions', query]` |

The three files exist as stubs (throwing `not implemented`, with a `QueryStub` type): replace them
entirely. Use `queryOptions` from `@tanstack/react-query`. Do not reference the factory object inside
its own initializer (circular type inference): use a module-level `const KEY = 'accounts' as const`.

### Modify

| Path | Change |
|---|---|
| `apps/web/src/hooks/use-members.ts` | `useMembers` → `useQuery(memberQueries.list())`; invalidations → `memberQueries.all()` and `accountQueries.all()` (delete); drop `MEMBERS_KEY` |
| `apps/web/src/hooks/use-accounts.ts` | `useAccounts`/`useAccount` → `useQuery(accountQueries.list(query))` / `.detail(id)`; invalidations → `accountQueries.all()`; `setQueryData(accountQueries.detail(account.id).queryKey, account)`; drop `ACCOUNTS_KEY` |
| `apps/web/src/hooks/use-transactions.ts` | both hooks → `useQuery(transactionQueries.list(query))` (month hook keeps `monthTransactionsQuery`) |
| `apps/web/src/hooks/use-schedule.ts` | only the `useTransactions` hook and the `TRANSACTIONS_KEY` invalidations → `transactionQueries`; drop `TRANSACTIONS_KEY`. Payments untouched (slice 02) |
| `ARCHITECTURE.md` | add `apps/web/src/queries/` to Module map, Declared folders and Registry; update the Debt FE-1 row: members, accounts, transactions done in 01 |

### Read (allow-list)

- `ARCHITECTURE.md`, `.agents-fw/standards/frontend.md` (FE-1 only)
- `apps/web/src/hooks/use-members.ts`, `use-accounts.ts`, `use-transactions.ts`, `use-schedule.ts`
- `apps/web/src/repositories/{members,accounts,transactions}.repository.ts` (signatures only)
- `apps/web/src/lib/month-queries.ts`

### Reuse (from the registry)

- `apps/web/src/repositories/` — `queryFn` delegates to the existing repositories, no new fetch code.
- `apps/web/src/lib/month-queries.ts` — month windows stay built there; factories take the query.
- `packages/shared` query types (`AccountQuery`, `TransactionQuery`) — never redeclare.

### Style exemplars

- `apps/web/src/hooks/use-accounts.ts` — file header (JSDoc `@module`), naming, import order.

### Libraries

- `@tanstack/react-query` v5 — `queryOptions` helper. No new dependency.

### Forbidden

- Any file not listed above, in particular guards, pages, components, repositories, `use-charges.ts`.
- Editing `apps/web/__tests__/query-factories.test.ts` (locked). Existing tests must pass unmodified.
- Changing any key shape (adding a prefix, wrapping in an object): guards still hardcode them until 04.
- `useEffect`, a global key registry, a barrel `queries/index.ts` (no consumer yet).
- Deduplicating `useTransactions` between `use-transactions.ts` and `use-schedule.ts` (out of scope).

## Tests

### Locked (written by the Advisor, failing before execution)

- `apps/web/__tests__/query-factories.test.ts` — exact key shapes, `enabled` on detail, resource prefixes, month-window key.

Proof of failure: `cd apps/web && npx jest __tests__/query-factories.test.ts` → `Tests: 9 failed, 9 total` (`not implemented`).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- Factories for charges, payments (slice 02), incomes, transfers, monthly budgets, alerts, balances, exchange-rate (slice 03).
- Guards and pages using the factories, generic Guard (slice 04); list query (slice 05).

## Handoffs

