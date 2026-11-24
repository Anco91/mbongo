# Handoff — 02-query-factories-charges — 2026-11-24 16:37

Sub-spec: `specs/02-query-factories-charges.md` · Handoff: `docs/handoffs/20261124-1637-02-query-factories-charges.md` · Rules: SES-1..5

## Trigger

Sub-spec delivered (pushed + PR #25).

## Done

- `chargeQueries` and `paymentQueries` implemented; `use-charges.ts` and `use-schedule.ts` read, prefetch and invalidate through them; `ARCHITECTURE.md` updated (executor, branch `feat/02-query-factories-charges`).
- Prettier fixes on `use-charges.ts` and `payments.ts` (lint was failing on 3 errors).
- Review by `agents-fw-reviewer`: APPROVE, no blocking finding.

## Left

- Merge PR #25 once CI is green (no checks are reported on the branch).
- Next slice: 03 (factories for incomes, transfers, monthly budgets, alerts, balances, exchange-rate), per `specs/SPEC_MASTER.md`.

## Decisions

- `CHARGE_KEY`, `chargeKey`, `chargePaymentsKey`, `PAYMENTS_KEY` removed (no consumer outside the hooks) — written in the spec Frame.
- `useNextPayment` now reads `paymentQueries.byCharge(id)` + `select: nextPayment`; removes the shared-key/different-queryFn conflict (criterion 3).

## Files touched

- `apps/web/src/queries/charges.ts` — modified (stub replaced)
- `apps/web/src/queries/payments.ts` — modified (stub replaced)
- `apps/web/src/hooks/use-charges.ts` — modified
- `apps/web/src/hooks/use-schedule.ts` — modified
- `ARCHITECTURE.md` — modified

## Tests

`cd apps/web && npx jest`: 74 suites, 593 tests pass (locked test 9/9, untouched). `npm run typecheck` clean, `npm run lint` clean after prettier fix. `test-lock.sh specs/02-query-factories-charges.md` returns 0.

## Blockers / risks

- None. Behavior change (intended): `useNextPayment` fetches all payments of the charge instead of PENDING only; `nextPayment` filters PENDING, so the result is unchanged.

## Next action

Merge PR #25 when green, then the Advisor writes sub-spec 03.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-1637-02-query-factories-charges.md
Sub-spec: specs/02-query-factories-charges.md (master: specs/SPEC_MASTER.md)
First action: Confirm PR #25 is merged, then write sub-spec 03 (factories for the remaining resources) and lock its tests.
```
