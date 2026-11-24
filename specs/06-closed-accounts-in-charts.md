---
id: 06-closed-accounts-in-charts
status: draft
branch: feat/06-closed-accounts-in-charts
tier: medium
locked_at:
locked_tests: []
---

# 06 — Closed accounts out of the charts, hard delete of an account

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5, BE-4

## Goal

A closed account no longer feeds the dashboard Sankey nor the donut (no « M1 Verify » node, no
orphan « 312 € Impôts » slice). The owner can hard delete an account together with its history when
it is useless (test data), instead of being stuck with « close it instead ».

## Diagnosis (checked in `apps/web/prisma/dev.db`, 2026-11-24)

- Nothing is hardcoded. `computeSankeyFlows` and `computeDonutExpenses` take every transaction of the
  month, whatever the account status. Closed accounts still own transactions (UBS Courant 5, BNP Perso 2,
  M1 Verify CHF/EUR 1 each), hence the ghost nodes.
- The « 312 € impôts » is the transaction « Prélèvement impôt 3e » (−312 EUR) on the closed account
  « BNP Perso ». The live charge « Impôt FR » is 711 EUR/month and is unrelated.
- `AccountService.remove` refuses any account with transactions, snapshots, outgoing transfers or
  charges (409), so test accounts cannot be deleted today.

## Decisions to validate (human)

1. **Charts hide every CLOSED account**, whatever the month. Simple, matches « I closed it, I do not
   want it in the Sankey ». Cost: a past month loses the flows of an account closed since. Alternative
   (not retained): hide only months after `closedAt`.
2. **Hard delete = explicit `DELETE /api/accounts/:id?cascade=true`**, only for a CLOSED account,
   deleting its transactions, snapshots and transfers touching it in one Prisma transaction. Refused (409)
   if a charge still points at it (charges stay `RESTRICT`). No schema change. The UI asks a confirmation
   naming what will be deleted (count of transactions / snapshots / transfers).

## Acceptance criteria

1. Given a closed account with transactions in the month, when the dashboard Sankey and donut are
   computed, then none of its transactions, transfers, nor charges/payments appear.
2. Given only active accounts, then the outputs are identical to today (existing suites unmodified).
3. Given a CLOSED account with history, when `DELETE ...?cascade=true`, then the account and its
   transactions, snapshots and transfers are gone, and a payment linked to a deleted transaction is
   unlinked, not deleted.
4. Given an ACTIVE account, or an account with a charge, when `cascade=true`, then 409 and nothing is deleted.
5. Given `DELETE` without `cascade`, behaviour is unchanged (409 when it has data).

## Frame

Standards to read first (CTX-5): `.agents-fw/standards/backend.md > Service`, `frontend.md > Page → View → Guard → Content`.

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `packages/shared/src/lib/calculation/active-accounts.ts` | pure rule | `excludeClosedAccounts(input: { accounts: Account[]; transactions: Transaction[]; transfers: Transfer[]; charges: Charge[]; payments: Payment[] }): typeof input` — drops closed accounts and every row pointing at one (transactions/charges by `accountId`, transfers by source or target, payments by their charge) |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/index.ts` | export `excludeClosedAccounts` |
| `apps/web/src/components/dashboard/use-dashboard-data.ts` | pass `sankeyData` / `donutData` inputs through `excludeClosedAccounts`; balances and consolidated net worth untouched |
| `apps/web/src/server/accounts/account.service.ts` | `remove(id, opts?: { cascade?: boolean })`: cascade path per criteria 3–4, inside `prisma.$transaction` |
| `apps/web/src/server/accounts/accounts.controller.ts` | `remove` reads `cascade` from the query string, delegates, maps errors |
| `apps/web/src/app/api/accounts/[id]/route.ts` | forward the request to `remove` |
| `apps/web/src/hooks/use-accounts.ts` | delete mutation accepts `{ cascade }`; invalidates through `accountQueries` (FE-11) |
| accounts page delete UI (Executor locates, asks if outside Frame) | confirmation dialog listing what is deleted |
| `ARCHITECTURE.md` | register `excludeClosedAccounts` (CTX-3) |

### Reuse

- `Account.status` / `closedAt` (already in the schema); `accountQueries` factory (spec 01).

### Libraries

- shadcn/ui `AlertDialog` for the confirmation (LIB-1). No new dependency.

### Forbidden

- Any schema or migration change. No seed. No filtering inside `computeSankeyFlows` / `computeDonutExpenses`
  (the rule lives in one pure function, called once).
- Changing balances, net worth or the account list (closed accounts stay visible there).

## Tests (to write by the Advisor once the decisions are validated)

- Pure: `excludeClosedAccounts` nominal, transfer touching one closed side, payment via charge, empty, all active.
- Boundary (P3): cascade refused on ACTIVE account and on account with a charge.

## Out of scope

- Archiving transfers (09), net worth hover (08), per-month closure semantics.

## Handoffs
