# Handoff — 17-link-transaction-to-income — 2026-11-24 21:10

Sub-spec: `specs/17-link-transaction-to-income.md` · Handoff: `docs/handoffs/20261124-2110-17-link-transaction-to-income.md` · Rules: SES-1..5

## Trigger

Sub-spec delivered (PR opened from `feat/17-link-transaction-to-income`).

## Done

- Tests locked b0298dd, spec written, `checkIncomeLink` + `POST /api/incomes/{id}/link` implemented a78f5b1 (Executor), registry row, spec/master `done`.

## Left

- Next: spec 18 (unmatched income screen: list, proposals, « Lier » button, hook + cache invalidation). 15 and 16 are independent.
- Optional: Reviewer agent pass; service/controller (criteria 3-7) have no automated test, only tsc and Advisor review.
- Human visual check of spec 12 criterion 6 (Sankey without stripes).
- Pre-existing prettier lint errors in `domain/income.ts` and `domain/settlement.ts` (`npm run lint` fails on main).

## Decisions

- Month is an explicit body field; the transaction date must fall in it (same invariant as the D3 guard on confirmed transactions).
- Link sets only `incomeId` and `budgetMonth`; `category`, `note`, `date`, `amount` untouched.
- A transaction already matched to a charge payment is refused (409).
- Rules in pure `checkIncomeLink`; service loads facts and maps errors (422/409, P2002 race → 409).
- Route in the incomes module (`/incomes/{id}/link`), not in transactions.

## Files touched

- `packages/shared/src/domain/income-link.ts`, `apps/web/__tests__/income-link.test.ts`, `apps/web/src/app/api/incomes/[id]/link/route.ts`, `specs/17-link-transaction-to-income.md` — created
- `packages/shared/src/index.ts`, `schemas/income.ts`, `contracts/incomes.http.ts`, `income.service.ts`, `incomes.controller.ts`, `incomes.repository.ts`, `ARCHITECTURE.md`, `specs/SPEC_MASTER.md` — modified

## Tests

`npx jest income-link`: 15/15. Full Jest: 441/441 (42 suites). `tsc --noEmit` clean, prettier clean on touched files, `test-lock.sh` exit 0. Reviewer agent not run.

## Blockers / risks

- none

## Next action

Write sub-spec 18 from its master row, reusing `findUnmatchedIncome` (14) and `incomesRepository.link` (17).

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-2110-17-link-transaction-to-income.md
Sub-spec: specs/17-link-transaction-to-income.md (master: specs/SPEC_MASTER.md)
First action: write sub-spec 18 (or 15) from its master row.
Stop: none
```
