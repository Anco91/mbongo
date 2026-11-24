# Handoff — 07-budget-remaining-recompute — 2026-11-24 19:06

Sub-spec: `specs/07-budget-remaining-recompute.md` · Handoff: `docs/handoffs/20261124-1906-07-budget-remaining-recompute.md` · Rules: SES-1..5

## Trigger

~44 tool calls.

## Done

- Human gave « go ». Executor (small) delivered 07: commit `cbf657b` pushed on `feat/07-budget-remaining-recompute`. Typecheck, lint, 9/9 locked tests, `budget` suites, `test-lock.sh`, `arch-check.sh` all rc=0.
- Frame fix by Advisor: `useIncomes({ active: 'true' })` (`IncomeQuery.active` is a string enum). Removal of `useAccounts` in recap-step accepted.
- Reviewer: APPROVE, no blocking finding. LOW: `roundToCents` in `income.ts` duplicates `round2` of `budget.ts` (non-blocking).
- Row 11 re-diagnosed: NOT a code defect. `generatePayments` always generates the anchor month; fix `8b4f424` (2026-11-24, « due day ») is in place and `create` passes `startOfDay(now)`. The 14 charges were created 2026-11-23 before that fix, so their dev.db payments start 2026-12-23 (stale data). Updating a charge on a schedule field regenerates its payments.

## Left (order)

1. SPEC-3: update `specs/current/monthly-budget/spec.md`, requirement « Récapitulatif du mois préparé »: revenus = expected income (confirmed amount else planned, per source due in month), not positive transactions; adapt scenarios « Revenu non saisi » and « Revenu d'une source démarrée un mois précédent »; tile « Revenus prévus ». Set sub-spec status `done`, master row 07 `done`. Commit.
2. Open PR for 07, merge on green (GIT-7).
3. Ask the human: repair script to regenerate missing first-month payments of existing charges in dev.db (option 2), or re-save each charge (option 1). Do not touch dev.db unasked. No row 11 spec unless the human wants a script.
4. Write row 12 (draft): Sankey income leg (expected income) + planned-link rendering. Sankey stripes cause still unverified (`sankey-flows-chart.tsx`, `sankey.ts`). Add to master as draft.
5. Open question (human): should one-off positive transactions without `incomeId` count? Today ignored.

## Decisions

- Recap income = expected income (human, 2026-11-24); registered in ARCHITECTURE.md by the Executor.

## Files touched

- `packages/shared/src/domain/income.ts`, `apps/web/src/components/budget/steps/recap-step.tsx`, `ARCHITECTURE.md`, `specs/07-budget-remaining-recompute.md` (commit `cbf657b`).

## Tests

`cd apps/web && npx jest __tests__/month-expected-income.test.ts` → 9 passed.

## Blockers / risks

- Worktree `~/.local/share/opencode/worktree/f905f2/feat-charge-payment-recovery` still present (user can remove it with `!`).
- Criterion 4 (prepared month) not checked in the UI.

## Next action

Do SPEC-3 on `specs/current/monthly-budget/spec.md`, then PR and merge 07.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-1906-07-budget-remaining-recompute.md
Sub-spec: specs/07-budget-remaining-recompute.md (master: specs/SPEC_MASTER.md)
First action: Update specs/current/monthly-budget/spec.md (SPEC-3), mark 07 done, open the PR and merge on green; then ask the human about the dev.db repair script and write row 12 (Sankey income leg).
```
