# Handoff — 38-projected-balance — 2026-11-25 16:14

Sub-spec: `specs/38-projected-balance.md` · Handoff: `docs/handoffs/20261125-1614-38-projected-balance.md` · Rules: SES-1..5

## Trigger

SES-2: 40 tool calls reached.

## Done

- Spec 38 follow-ups, fast-track, both merged to main:
  - PR 83 (`6f6342f`): `wealth-card.tsx` month name via new `monthNameLabel` in `month-navigation.ts`.
  - PR 84 (`bbd8bf1`): `useSuspenseQuery` for the two pending-payments queries in `use-dashboard-data.ts`; type import moved after value imports; billing day in `projected-balance.ts` formatted with date-fns `format`.
- Manual check done in the app (dev server on :3000, relaunched with `npm run dev:web`): December shows « Projeté fin décembre », 6 628,65 € (Nov: 3 560,50 €). Month switch does not blank the page.
- The « 1 Issue » badge of the Next dev overlay is a hydration warning caused by a browser extension (`data-lt-installed` on `<html>`). Not from the project.

## Left

- Check that a future-dated transaction leaves today's wealth unchanged. The DB holds 7 transactions and none is future-dated, so this needs a temporary test transaction (create, check the dashboard wealth card, delete) or a unit test. No test file for `balanceAsOf` was found by name in the last search (`git ls-files | grep` matched only sankey and donut tests in `apps/web/__tests__`); check `packages/shared` for the locked spec 38 tests before adding one.
- Spec 35 check: Nov 2026 Sankey, donut and budget totals match.

## Decisions

- Follow-ups split into two PRs because four files exceed WF-5 (3 files). Written in the PR descriptions.
- Billing day: `format(nextBillingDate, 'yyyy-MM-dd')` replaces local getters rebuilt as UTC. Same day expected; not proven by a test.

## Files touched

- `apps/web/src/components/dashboard/cards/wealth-card.tsx` — modified
- `apps/web/src/lib/month-navigation.ts` — modified (added `monthNameLabel`; not yet in the `ARCHITECTURE.md` registry)
- `apps/web/src/components/dashboard/use-dashboard-data.ts` — modified
- `packages/shared/src/lib/calculation/projected-balance.ts` — modified

## Tests

`npx turbo run typecheck lint test --filter=@mbongo/web --filter=@mbongo/shared`: 5 tasks successful, 668 web tests passed, before each PR. `test-lock.sh` and `arch-check.sh` were not run for these fast-track PRs (arch-check printed nothing).

## Blockers / risks

- `monthNameLabel` is a new export; CTX-3 asks for a registry line in `ARCHITECTURE.md`. Not added.
- Dev server started in the background by this session still runs on :3000; log at the session scratchpad `dev.log`.

## Next action

Verify the future-dated transaction case (unit test or temporary transaction), compare the Nov 2026 spec 35 totals, then register `monthNameLabel` in `ARCHITECTURE.md`.

## Resume block

```
NEXT SESSION
Role: executor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-1614-38-projected-balance.md
Sub-spec: specs/38-projected-balance.md (master: specs/SPEC_MASTER.md)
First action: Check that a future-dated transaction leaves today's wealth unchanged, then compare Nov 2026 Sankey, donut and budget totals (spec 35).
Stop: none
```
