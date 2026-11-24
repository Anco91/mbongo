---
id: account-statement-gap
status: ready
branch: feat/account-statement-gap
tier: medium
locked_at: 5afd317
locked_tests:
  - apps/web/__tests__/statement-gap.test.ts
---

# Frame — account-statement-gap

OpenSpec change `openspec/changes/account-statement-gap/`: goal in `proposal.md`, acceptance criteria in
`specs/*/spec.md`, checklist in `tasks.md`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5. Master row 16. Needs 13 (done).

## Summary

Un relevé de banque peut être comparé au solde de l'app. La carte du compte affiche l'écart du dernier relevé, calculé à sa date. Lecture seule, aucun changement de schéma.

## Frame

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/queries/snapshots.ts` | query factory | `snapshotQueries.all()`, `snapshotQueries.list(query?: SnapshotQuery)` |
| `apps/web/src/hooks/use-snapshots.ts` | hook | `useSnapshots(): UseQueryResult<BalanceSnapshot[]>` |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/balance.ts` | add `computeStatementGap(account: {id; openingBalance}, transactions: {accountId; date; amount}[], snapshots: {accountId; date; balance; createdAt}[]): { snapshotDate: string; calculated: number; gap: number } \| null` |
| `packages/shared/src/index.ts` | export it if the barrel is not a `export *` |
| `apps/web/src/lib/accounts.ts` | `buildAccountCards(accounts, transactions, snapshots = [], now)`; `AccountCardView.statementGap` |
| `apps/web/src/components/accounts/use-accounts-view.ts` | load snapshots with `useSnapshots` |
| `apps/web/src/components/accounts/account-card.tsx` | statement gap line |
| `ARCHITECTURE.md` | registry row `computeStatementGap`; `snapshotQueries` in the factories list |
| `specs/current/account-management/spec.md` | Advisor only, at review (SPEC-2/3) |

### Read (allow-list)

- `ARCHITECTURE.md`
- `packages/shared/src/domain/balance.ts`, `schemas/snapshot.ts`, `schemas/transaction.ts` (date format)
- `apps/web/src/queries/accounts.ts`, `hooks/use-accounts.ts`, `repositories/snapshots.repository.ts`
- `apps/web/src/lib/accounts.ts`, `components/accounts/*`

### Reuse (from the registry)

- `computeBalance`, `computeSnapshotGap` (`domain/balance.ts`), `snapshotsRepository`, `accountQueries` (factory shape), `buildAccountCards`, `formatAmount`.

### Style exemplars

- `apps/web/src/queries/accounts.ts` — factory shape.
- `packages/shared/src/domain/schedule.ts` — pure domain function.

### Libraries

- date-fns only if needed. TanStack Query. None new.

### Forbidden

- Prisma schema, migration, server, API route, `useBalances`, alerts. Any file not listed: stop and ask.

## Tests

### Locked

`apps/web/__tests__/statement-gap.test.ts` (pure `computeStatementGap`, TEST-1). Stub `computeStatementGap` in `balance.ts` throws `not implemented`: the Executor replaces the body.

Proof of failure: `npx jest __tests__/statement-gap.test.ts` → 10 failed, `not implemented`.

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Handoffs
