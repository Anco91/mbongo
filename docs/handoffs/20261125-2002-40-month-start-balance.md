# Handoff — 40-month-start-balance — 2026-11-25 20:02

Sub-spec: `specs/40-month-start-balance.md` · Handoff: `docs/handoffs/20261125-2002-40-month-start-balance.md` · Rules: SES-1..5

## Trigger

SES-2: the session hook reported 40+ tool calls. Executor delivered and Reviewer approved; only the Advisor closing steps remain.

## Done

- `4bf700b` spec 40 + locked schema tests (23 red before code); `661045c` lock; prettier-only reformat of the locked test re-pinned (`locked_at` = that commit), `test-lock.sh` rc=0.
- `fa87a7e` implementation pushed on `spec/40-month-start-balance`: schema, contract, Prisma model + additive migration `20261125185850_month_start_balances`, service/controller/route, repository, queries, hooks, `useMonthStart`, accounts step (no longer writes `openingBalance`), `ARCHITECTURE.md`.
- Executor results: locked test 23/23, full suite 704 pass, typecheck, build, `arch-check.sh` green; lint green after the test reformat.
- Reviewer: no CRITICAL/HIGH; approve. Notes: `save` accepts CLOSED accounts (UI offers ACTIVE only); `useMonthStart` duplicates the `computeProjectedBalance` wiring of `use-dashboard-data.ts` (extract later); no service test (optional).
- Dev DB migrated by the Executor after a backup (`dev.db.bak` in the session scratchpad). No rows written.

## Left

1. SPEC-3: add requirement « Solde de départ du mois » (+ scenarios: saved value wins over suggestion, suggestion default when nothing saved, `openingBalance` untouched, `GET` empty month) to `specs/current/monthly-budget/spec.md`; adjust the scenarios « Correction du solde d'ouverture » / « Ajustement du solde d'ouverture » (lines ~109, ~120) that describe editing `openingBalance` in the accounts step.
2. Set spec 40 `status: done`, master row 40 `done`; commit.
3. Check `/budget/2026-12` returns 200 on the dev server, GET only, no writes (AC5, and the check left open since row 41).
4. Open the PR, wait for green checks, merge (GIT-7: no asking), then a closing handoff.

## Decisions

- Written in `specs/40-month-start-balance.md` (Decisions section): dedicated table, upsert per (month, account), default = saved ?? suggestion, cents-only balances, `GET` empty month = `[]`.
- Prettier-only change of a locked test by the Advisor, re-locked (not an Executor edit).

## Files touched

- `specs/40-month-start-balance.md` — created, `locked_at` re-pinned
- `specs/SPEC_MASTER.md` — row 40 `ready`
- `apps/web/__tests__/month-start-balance-schema.test.ts` — created, reformatted
- Implementation files — see commit `fa87a7e`

## Tests

`npm run test` 704 pass; locked test 23/23; `test-lock.sh specs/40-month-start-balance.md` rc=0; typecheck, lint, build, `arch-check.sh` green (Executor + Advisor re-run of lint).

## Blockers / risks

- None. Migration already applied to the dev DB; do not re-run a reset.

## Next action

Update `specs/current/monthly-budget/spec.md` (SPEC-3), mark spec 40 and master row 40 `done`, then open the PR.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-2002-40-month-start-balance.md
Sub-spec: specs/40-month-start-balance.md (master: specs/SPEC_MASTER.md)
First action: On branch spec/40-month-start-balance, update specs/current/monthly-budget/spec.md (SPEC-3), mark spec 40 and master row 40 done, check GET /budget/2026-12 is 200, open the PR and merge on green.
Stop: none
```
