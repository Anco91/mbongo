---
id: 06-closed-accounts-in-charts
status: ready
branch: feat/06-closed-accounts-in-charts
tier: medium
locked_at: ea04a48d857b05e875d3d7d024dd3461778fcf31
locked_tests:
  - apps/web/__tests__/exclude-closed-accounts.test.ts
---

# 06 — Show / hide closed accounts (dashboard charts, accounts page)

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5

## Goal

The user decides whether closed accounts count. On the dashboard, a toggle includes or hides them in
the Sankey and the donut, which are recomputed on each change (default: hidden, so « M1 Verify » and
the « 312 € impôts » slice disappear). On the accounts page, a checkbox lists closed accounts too.
Hard delete is postponed (risky).

## Diagnosis (checked in `apps/web/prisma/dev.db`, 2026-11-24)

- Nothing is hardcoded. `computeSankeyFlows` / `computeDonutExpenses` take every transaction of the
  month whatever the account status, and closed accounts still own transactions.
- The 312 € is the transaction « Prélèvement impôt 3e » (−312 EUR) on the closed « BNP Perso ».
  The live charge « Impôt FR » (711 EUR/month) is unrelated.

## Acceptance criteria

1. Given the dashboard with the toggle off (default), when Sankey and donut are computed, then no
   transaction, transfer, charge or payment of a closed account appears.
2. Given the toggle switched on, then the charts include them again; switching back removes them
   (recomputed through `useMemo`, no refetch).
3. Given only active accounts, outputs are identical to today (existing suites unmodified).
4. Given the accounts page, then closed accounts are hidden by default; ticking « Afficher les
   comptes clôturés » lists them, each card marked « Clôturé »; the member filter still applies.
5. Balances, consolidated net worth and alerts ignore the toggle (unchanged).

## Frame

Standards to read first (CTX-5): `.agents-fw/standards/frontend.md > Page → View → Guard → Content`.

### Replace (stub exists, locked test pins it)

| Path | Role | Exports |
|---|---|---|
| `packages/shared/src/lib/calculation/active-accounts.ts` | pure rule | `excludeClosedAccounts(input: AccountScopedData): AccountScopedData` — keep `AccountScopedData`; drop closed accounts, their transactions and charges (`accountId`), transfers touching one (source or target), payments of dropped charges; no mutation |

### Create

| Path | Role | Exports |
|---|---|---|
| `apps/web/src/components/patterns/show-closed-toggle.tsx` | shared labelled checkbox | `ShowClosedToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): JSX.Element` — shadcn `Checkbox` + `Label` « Afficher les comptes clôturés »; exported from `patterns/index` |

### Modify

| Path | Change |
|---|---|
| `apps/web/src/components/dashboard/use-dashboard-data.ts` | signature `useDashboardData(selectedMonth: string, showClosed = false)`; when false, run `excludeClosedAccounts` on accounts/transactions/transfers/charges/payments before `computeSankeyFlows` and `computeDonutExpenses` (inside their `useMemo`, `showClosed` in deps); balances, consolidated, totalCharges untouched |
| `apps/web/src/components/dashboard/dashboard-content.tsx` | `useState(false)` `showClosed`, pass to the hook, render `ShowClosedToggle` above the Sankey/donut cards |
| `apps/web/src/components/accounts/use-accounts-view.ts` | add `showClosed` / `setShowClosed` (`useState(false)`); active-only filter becomes `showClosed \|\| status === 'ACTIVE'` |
| `apps/web/src/components/accounts/accounts-content.tsx` | render `ShowClosedToggle` next to the member filter |
| `apps/web/src/components/accounts/account-card.tsx`, `apps/web/src/lib/accounts.ts` | expose `status` on the card view model; show a « Clôturé » badge when CLOSED |
| `ARCHITECTURE.md` | register `excludeClosedAccounts` and `ShowClosedToggle` (CTX-3) |

### Read (allow-list)

`ARCHITECTURE.md`, the files above, `apps/web/src/components/patterns/index.ts`, `docs/LEXIQUE.md` (wording).

### Reuse

`Account.status` (schema), shadcn/ui `Checkbox`, `Label` (LIB-1). No new dependency (`nuqs` is not
installed; the month cursor already uses `useState`, stay consistent).

### Forbidden

- Any schema change, migration, seed, delete endpoint. Editing the locked test.
- Filtering inside `computeSankeyFlows` / `computeDonutExpenses`.
- Persisting the toggle (no URL, no storage) in this slice.

## Tests

### Locked

- `apps/web/__tests__/exclude-closed-accounts.test.ts` — 6 tests: empty, all active, closed account +
  transactions, transfer on either side, charges + their payments, no mutation.

Proof of failure: `cd apps/web && npx jest __tests__/exclude-closed-accounts.test.ts` → 6 failed
(`not implemented`); `npm run typecheck` clean.

### Proposed by the Executor / Test change requests

| Path | What it covers | Status |
|---|---|---|

## Out of scope

- Hard delete of accounts (postponed, risky). Net worth hover (08), transfers archive (09).
- Per-month closure semantics (a closed account is hidden for all months when off).

## Handoffs
