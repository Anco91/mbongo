---
id: 17-link-transaction-to-income
status: ready
branch: feat/17-link-transaction-to-income
tier: medium
locked_at: b0298dd
locked_tests:
  - apps/web/__tests__/income-link.test.ts
---

# 17 — Link an existing transaction to an income source and month

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5, BE-1..4

## Summary

Un salaire arrivé sur le compte sans passer par « Confirmer » reste hors du reste à vivre, même une fois repéré (spec 14). Cette tranche ajoute l'API qui rattache cette transaction à sa source de revenu et à un mois, sans la dupliquer ni la recréer. Aucun écran encore : le bouton « Lier » vient en 18. no behaviour change visible.

## Goal

`POST /api/incomes/{id}/link` sets `incomeId` and `budgetMonth` on an existing transaction. All
invariants are decided by a pure function and re-checked by the server (BE-3, BE-4). No schema
migration, no UI.

## Acceptance criteria

1. `linkIncomeSchema` = `{ transactionId: string(min 1), month: monthKeySchema }`.
2. `checkIncomeLink(context)` returns the first failing rule, else `null`, in this order:
   `amount-not-positive` (amount ≤ 0), `transfer-leg` (`transferId` set), `already-linked`
   (`incomeId` set), `payment-linked` (`hasPayment`), `account-mismatch` (accounts differ),
   `income-inactive`, `income-not-due` (`isIncomeDueForMonth` false), `date-outside-month`
   (`yyyy-MM` of the date ≠ month, date-fns `parseISO` + `format`, local time), `month-already-confirmed`
   (`confirmedTransactionId` not null). Pure, inputs not mutated.
3. `incomeService.linkTransaction(id, input)`: loads income (404 `NotFoundError('Income', id)`),
   transaction (404 `NotFoundError('Transaction', id)`), the transaction already confirming
   (`incomeId`, `budgetMonth`) and any `Payment` with that `transactionId`; calls `checkIncomeLink`.
4. Error mapping: `income-inactive`, `income-not-due`, `amount-not-positive`, `account-mismatch`,
   `date-outside-month`, `transfer-leg` → `HttpError(422)`; `already-linked`, `payment-linked`,
   `month-already-confirmed` → `HttpError(409)`. Message = readable English sentence per error.
5. On success: `prisma.transaction.update` sets only `incomeId` and `budgetMonth`; `category`, `note`,
   `date`, `amount` untouched. Returns the `Transaction` (200, `toSuccessResponse`).
6. A concurrent link losing the `@@unique([incomeId, budgetMonth])` race (Prisma `P2002`) → 409
   `month-already-confirmed` message, not 500.
7. `IncomeHttp.link(id, input)` and `incomesRepository.link` call `POST /incomes/{id}/link`, parse the
   response with `transactionSchema`.

Criteria 1-2 are pinned by the locked test. 3-7 are glue (TEST-2): checked by `tsc` and review.

## Frame

Standards to read first (CTX-5): `.agents-fw/standards/backend.md` > Rules.

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/app/api/incomes/[id]/link/route.ts` | route wiring | `POST(request, { params })` → `incomesController.link(id, request)` (same shape as `confirm/route.ts`) |

The stub `packages/shared/src/domain/income-link.ts` and its export exist (b0298dd).

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/income-link.ts` | Replace the `throw` body of `checkIncomeLink` by the logic (criterion 2); remove `void`. Types and signature unchanged |
| `packages/shared/src/schemas/income.ts` | Replace the stub `linkIncomeSchema = z.object({})` by criterion 1; drop the `STUB` mention in its JSDoc. `LinkIncomeInput` stays |
| `packages/shared/src/contracts/incomes.http.ts` | Add `link(id: string, input: LinkIncomeInput): Promise<Transaction>` with a one-line JSDoc |
| `apps/web/src/server/incomes/income.service.ts` | Add `linkTransaction(id, input: LinkIncomeInput): Promise<Transaction>` (criteria 3-6). Reuse the private `toTransaction`. Error map as a small `const` object `LINK_ERRORS: Record<IncomeLinkError, { status: 409 \| 422; message: string }>` |
| `apps/web/src/server/incomes/incomes.controller.ts` | Add `link(id, request)`: `parseBody(request, linkIncomeSchema)` → `incomes.linkTransaction` → `toSuccessResponse`; `toErrorResponse` in catch |
| `apps/web/src/repositories/incomes.repository.ts` | Add `link` next to `confirm` (criterion 7) |

### Read (allow-list)

- `ARCHITECTURE.md`
- `packages/shared/src/domain/income-link.ts`, `domain/income-matching.ts` (types only), `domain/income.ts` (`isIncomeDueForMonth` signature)
- `packages/shared/src/schemas/income.ts`, `schemas/transaction.ts` (`transactionSchema`)
- `packages/shared/src/contracts/incomes.http.ts`
- `apps/web/src/server/incomes/income.service.ts`, `incomes.controller.ts`
- `apps/web/src/server/common/http.ts`
- `apps/web/src/app/api/incomes/[id]/confirm/route.ts`
- `apps/web/src/repositories/incomes.repository.ts`
- `apps/web/prisma/schema.prisma` (models `Transaction`, `Payment` only)

### Reuse (from the registry)

- `isIncomeDueForMonth` (`domain/income.ts`) — due-month rule.
- `MatchableTransaction` (`domain/income-matching.ts`) — transaction shape for the rule.
- `monthKeySchema` (`schemas/monthly-budget.ts`) — month key validation, already used by `confirmIncomeSchema`.
- `HttpError`, `NotFoundError`, `parseBody`, `toSuccessResponse`, `toErrorResponse` (`server/common/http.ts`).
- `incomeService.toTransaction` — row → `Transaction` mapping.

### Style exemplars

- `apps/web/src/app/api/incomes/[id]/confirm/route.ts` — route file.
- `incomeService.confirm` / `incomesController.confirm` — service and controller method shape.

### Libraries

- date-fns `parseISO`, `format` (domain); Zod (schema). None new.

### Forbidden

- Any file not listed. Editing `income-link.test.ts` (locked) or the exported types.
- A new Prisma migration or schema change; `@@unique([incomeId, budgetMonth])` already holds.
- Logic in the controller or the route. Rules live in `checkIncomeLink`; the service only loads facts
  and maps errors.
- Touching `transaction.service.ts`: the generic update stays as is (it cannot set `incomeId`).
- Currency conversion, unlink, hook, UI (spec 18). No `console.log`.
- `ARCHITECTURE.md` registry row: the Advisor adds it at review (CTX-3).

## Tests

### Locked

- `apps/web/__tests__/income-link.test.ts` — criteria 1-2.

`@mbongo/shared` is read through `dist`: run `npm run build -w packages/shared` before `jest`.

### Proof of failure

`npm run build -w packages/shared && cd apps/web && npx jest income-link`

```
Tests: 15 failed, 15 total   (13: Error: not implemented; 2 schema tests: stub accepts anything)
```

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- Screen, « Lier » button, TanStack hook and cache invalidation: spec 18.
- Unlinking a confirmed transaction; moving a link to another month or source.
- Cross-currency links (same `accountId` is required), partial payments of one source.
- Setting `category` to `SALAIRE` on link: left untouched on purpose.

## Handoffs

