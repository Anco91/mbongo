# Handoff — 34-budget-journey-scenarios — 2026-11-25 14:37

Sub-spec: `specs/34-budget-journey-scenarios.md` · Handoff: `docs/handoffs/20261125-1437-34-budget-journey-scenarios.md` · Rules: SES-1..5

## Trigger

~30 tool calls (SES-2) and the first half of 34 delivered; the `projection` file needs the Frame of 35 first.

## Done

- PR #78 (spec 33) reviewed: capability spec `specs/current/dashboard/spec.md` and `docs/LEXIQUE.md` updated (SPEC-3), row 33 done, merged.
- PR #79 (docs: plan + rows 34-37) merged.
- 34 `current` half written and locked: fixture `apps/web/__tests__/stubs/budget-journey-fixture.ts`, tests `apps/web/__tests__/scenarios/budget-journey.current.test.ts` (7 red, 6 green, proof table in the sub-spec), lock commit `83e1767`. `test-lock.sh` passes. Branch `test/budget-journey-scenarios`, draft PR #80, **not to merge before 35**.

## Left

1. Advisor: write the Frame of 35 (signatures `balanceAsOf`, `computeProjectedBalance`, `computeMonthState`; list of Advisor-modified existing tests: Sankey/donut tests for the provision branch D8).
2. Advisor: write `budget-journey.projection.test.ts` (scenarios 1, 2 patrimoine, 4 patrimoine, 6 to 9, 11) with a hand-checked table at the top, minimal throwing stubs so it compiles, proof of failure, re-lock (`locked_at`, `locked_tests`) on branch `test/budget-journey-scenarios`.
3. Executor (tier medium) implements 35 on a branch stacked on it; both PRs land together once green.
4. Then 37, then 36.

## Decisions

- Red locked tests stay on a draft PR, merged together with 35 (GIT-7 would block main otherwise). Written in the sub-spec.
- « PENDING later this month counts as due » is not a defect (existing test and capability spec); only overdue past-month PENDING is locked red.
- Fixture lives in `__tests__/stubs/` (Jest ignores it). TZ is pinned to UTC by `jest.global-setup.js`; fixture dates are noon UTC.

## Files touched

- `apps/web/__tests__/stubs/budget-journey-fixture.ts`, `apps/web/__tests__/scenarios/budget-journey.current.test.ts` — created
- `specs/34-budget-journey-scenarios.md` — created; `specs/SPEC_MASTER.md`, `specs/current/dashboard/spec.md`, `docs/LEXIQUE.md` — modified

## Tests

`cd apps/web && npx jest __tests__/scenarios` → 7 failed, 6 passed (expected). `tsc --noEmit`, eslint, prettier clean on the new files. `.agents-fw/scripts/test-lock.sh specs/34-budget-journey-scenarios.md` → exit 0.

## Blockers / risks

- Full `npm run test` is red on branch 34 by design. Do not merge PR #80 alone.
- `?compte=` pointing at a SAVINGS account is still accepted from the URL (spec 33 edge).
- Unconfirmed: `dueDate` time zone and `isWithinInterval` in `income.ts:48-62` (plan, Défauts).

## Next action

Advisor writes the Frame of sub-spec 35, then the `projection` test file.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-1437-34-budget-journey-scenarios.md
Sub-spec: specs/34-budget-journey-scenarios.md (master: specs/SPEC_MASTER.md)
First action: Write the Frame of sub-spec 35 (specs/35-projected-balance.md), then write and lock budget-journey.projection.test.ts on branch test/budget-journey-scenarios.
Stop: none
```
