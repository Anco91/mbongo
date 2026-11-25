# Handoff — 30-due-charges-owner-scope — 2026-11-25 01:35

Sub-spec: `specs/30-due-charges-owner-scope.md` · Handoff: `docs/handoffs/20261125-0135-30-due-charges-owner-scope.md` · Rules: SES-1..5

## Trigger

Sub-spec delivered (SES-1): change A merged.

## Done

- Handoff PR #72 merged (push succeeded on retry after GitHub 500).
- Change A (row 30) delivered: PR #73, OpenSpec change archived as `2026-11-25-due-charges-net-worth`, `specs/current/dashboard/spec.md` updated (SPEC-3), master row 30 `done`.

## Left

- Row 31 (change B): OpenSpec change for charge owner, `chargeOwner`, `scopeToMember` fix, per-account sub-chips (`?compte=`). Stop before the Prisma migration (human gate).

## Decisions

- Due charges = all current-month `PENDING` payments; earlier overdue months out of scope (hook loads one month); `null` when a CHF amount lacks a rate. Logged in the archived `design.md`.
- New files `due-charges.ts` and `remaining-to-live.ts` instead of editing `consolidated.ts`.
- Net line labelled « Patrimoine net » (executor's wording, added to `docs/LEXIQUE.md`).

## Files touched

- `packages/shared/src/lib/calculation/due-charges.ts`, `remaining-to-live.ts` — created
- `use-dashboard-data.ts`, `wealth-card.tsx`, `dashboard-content.tsx`, `docs/LEXIQUE.md`, `ARCHITECTURE.md`, `specs/current/dashboard/spec.md`, `specs/SPEC_MASTER.md` — modified

## Tests

21 new tests pass; full run 59 suites / 602 tests; typecheck, lint, build clean; `test-lock.sh` exit 0. Repo has no CI: PRs merged after local checks.

## Blockers / risks

- Row 31 migration = human gate. Check first whether existing accounts have `Account.memberId`.

## Next action

Advisor opens the OpenSpec change for row 31 from the « Change B » section of the sub-spec.

## Resume block

Paste this, filled, as the last message of the session (SES-4):

```
NEXT SESSION
Role: <advisor|executor|reviewer>
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-0135-30-due-charges-owner-scope.md
Sub-spec: specs/30-due-charges-owner-scope.md (master: specs/SPEC_MASTER.md)
First action: <one sentence>
Stop: none | done | human-gate: <reason>
```
