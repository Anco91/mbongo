---
id: 14-unmatched-income-matching
status: ready
branch: feat/14-unmatched-income-matching
tier: medium
locked_at: c724afa
locked_tests:
  - apps/web/__tests__/income-matching.test.ts
---

# 14 — Unmatched income detection and match proposals (domain)

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5

## Summary

Un salaire versé sur le compte sans avoir été confirmé depuis sa source n'est aujourd'hui ni compté dans le reste à vivre ni visible nulle part. Cette tranche ajoute la fonction pure qui repère ces entrées d'argent non rapprochées et propose, pour chacune, la source de revenu qui lui correspond avec l'écart par rapport au montant prévu. Aucun changement visible : le lien et l'écran suivent en 17 et 18. no behaviour change.

## Goal

`findUnmatchedIncome(transactions, incomes, options?)` lists the positive transactions linked to
neither a source nor a transfer, each with ranked source proposals (matching model (a),
`ARCHITECTURE.md` Decisions 2026-11-24). No schema change, no UI, no write.

## Acceptance criteria

1. A transaction is unmatched when `amount > 0`, `transferId` is null and `incomeId` is null/absent.
   Debits, transfer legs (SOURCE or TARGET) and transactions linked to a source are never listed.
2. Its `budgetMonth` is the `yyyy-MM` of its `date` (date-fns `parseISO` + `format`, local time like
   `income.service.ts`).
3. A source is proposed when it is due that month (`isIncomeDueForMonth`: active, in range, frequency)
   and has the same `accountId` as the transaction.
4. A source already confirmed for that month (a transaction in the input with that `incomeId` and
   `budgetMonth`) is not proposed; a confirmation of another month does not block it.
5. Each proposal carries `computeSettlement(income.amount, [transaction.amount], options)`
   (gap and status; `options.tolerance` passed through).
6. Proposals are sorted by smallest `|gap|`, then by `incomeId`. A transaction with no proposal is
   still listed, with `proposals: []`.
7. Unmatched entries are sorted by `date`, then by `transactionId`. Empty input → `[]`. Inputs are
   never mutated.

Two unmatched transactions may propose the same source: choosing is the caller's job (the
one-link rule stays enforced by `@@unique([incomeId, budgetMonth])`).

## Frame

Standards to read first (CTX-5): none beyond `ARCHITECTURE.md`.

### Create

None: the stub `packages/shared/src/domain/income-matching.ts` and its export exist (c724afa).

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/income-matching.ts` | Replace the `throw new Error('not implemented')` body of `findUnmatchedIncome` by the logic; remove the `void` lines. Keep exported types and signature unchanged. Private helpers allowed in the same file |

### Read (allow-list)

- `ARCHITECTURE.md`
- `packages/shared/src/domain/income-matching.ts`
- `packages/shared/src/domain/income.ts` (`isIncomeDueForMonth` only)
- `packages/shared/src/domain/settlement.ts` (signature of `computeSettlement`)

### Reuse (from the registry)

- `isIncomeDueForMonth` (`domain/income.ts`) — due-month rule, already tested.
- `computeSettlement` (`domain/settlement.ts`) — status and gap of each proposal.
- date-fns `parseISO`, `format` — month key; no hand-made date parsing.

### Style exemplars

- `packages/shared/src/domain/income.ts` — pure functions, JSDoc, no I/O.
- `packages/shared/src/domain/settlement.ts` — small private helpers below the exported function.

### Libraries

- date-fns (already used in `domain/`). None new.

### Forbidden

- Any file not listed. No currency conversion (same `accountId` means same currency), no
  Prisma/Next/HTTP, no new dependency, no class (ARCH-4).
- Editing `income-matching.test.ts` (locked) or the exported types.
- Mutating inputs (`sort` on a copy only).
- Touching `income.ts`, `settlement.ts`, `sankey.ts` or the remaining-to-live code.
- `ARCHITECTURE.md` registry row: the Advisor adds it at review (CTX-3).

## Tests

### Locked

- `apps/web/__tests__/income-matching.test.ts` — criteria 1-7.

`@mbongo/shared` is read through `dist`: run `npm run build -w packages/shared` before `jest`.

### Proof of failure

`npm run build -w packages/shared && cd apps/web && npx jest income-matching`

```
Tests: 13 failed, 13 total   (all: Error: not implemented)
```

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- Writing the link (set `incomeId` + `budgetMonth` on an existing transaction): spec 17.
- Listing screen and « Lier » action: spec 18.
- Salary booked in the month after its budget month (proposals use the transaction's own month only).
- Cross-currency matching, several transactions for one source (partial payments), tolerance policy.

## Handoffs

