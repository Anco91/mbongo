---
id: net-worth-breakdown-hover
status: ready
branch: feat/net-worth-breakdown-hover
tier: medium
locked_at: c59bcdb
locked_tests:
  - apps/web/__tests__/net-worth-terms.test.ts
---

# Frame — net-worth-breakdown-hover

OpenSpec change `openspec/changes/net-worth-breakdown-hover/`: goal in `proposal.md`, acceptance criteria in
`specs/*/spec.md`, checklist in `tasks.md`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5. Master row 08.

## Summary

La carte « Patrimoine consolidé » détaille son total au survol : un terme par compte actif (« + 1 000 CHF Épargne X », « − 500 EUR Compte courant X découvert »). Lecture seule, aucun changement de schéma.

## Frame

### Create

None.

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/lib/calculation/consolidated.ts` | replace the body of the stub `listNetWorthTerms(accounts: Account[], balances: Record<string, number>): NetWorthTerm[]` (interface `NetWorthTerm` already there) |
| `apps/web/src/components/dashboard/use-dashboard-data.ts` | `netWorthTerms = useMemo(() => listNetWorthTerms(accounts, balances))`, returned |
| `apps/web/src/components/dashboard/dashboard-content.tsx` | pass `terms={netWorthTerms}` to `WealthCard` |
| `apps/web/src/components/dashboard/cards/wealth-card.tsx` | prop `terms: NetWorthTerm[]`; card focusable (`tabIndex={0}`), panel revealed by `group-hover` / `group-focus-within`; one line per term: sign « + » / « − », `formatAmount(Math.abs(balance), currency)`, name, « découvert » for overdraft; extract a small `NetWorthTermRow` in the same file (FE-9) |
| `ARCHITECTURE.md` | registry row `listNetWorthTerms` |
| `specs/current/dashboard/spec.md` | Advisor only, at review (SPEC-2/3) |

### Read (allow-list)

- `ARCHITECTURE.md`
- `packages/shared/src/lib/calculation/consolidated.ts`
- `apps/web/src/components/dashboard/{use-dashboard-data.ts,dashboard-content.tsx,cards/wealth-card.tsx}`
- `apps/web/src/lib/format.ts`

### Reuse (from the registry)

- `computeConsolidatedBalance` rule for balances (`balances[id] ?? openingBalance ?? 0`), `round2` already in the file, `formatAmount`, `Card`.

### Style exemplars

- `packages/shared/src/lib/calculation/consolidated.ts` — pure function with TSDoc.
- `apps/web/src/components/dashboard/cards/wealth-card.tsx` — card component.

### Libraries

- None new. Tailwind `group` utilities.

### Forbidden

- Prisma, API, `computeConsolidatedBalance` behaviour, `ConsolidatedBalance` shape, any tooltip dependency. Any file not listed: stop and ask.

## Tests

### Locked

`apps/web/__tests__/net-worth-terms.test.ts` (pure `listNetWorthTerms`, TEST-1). Stub throws `not implemented`.

Proof of failure: `npx jest __tests__/net-worth-terms.test.ts` → 9 failed, `not implemented`.

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Handoffs

- `docs/handoffs/20261124-2218-net-worth-breakdown-hover.md`
