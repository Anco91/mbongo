# Handoff — 38-projected-balance (vers spec 39 month-journey) — 2026-11-25 17:00

Sub-spec: `specs/38-projected-balance.md` · Rules: SES-1..5

## Trigger

SES-2: 40 tool calls reached.

## Done

- Checks spec 38 / 35: future-dated transaction covered by the locked `balanceAsOf` tests; Nov 2026 Sankey = donut = budget = 3 762,62 EUR.
- `monthNameLabel` registered in `ARCHITECTURE.md` (PR 86, merged).
- Specs 35 and 38 archived as `done` (PR 87, merged), then judged premature by the human: the month journey is not tested.
- Backup tag `backup/csv-notes-20261125` pushed (CSV notes are docs already in git). Copy of the dev DB: scratchpad `dev-20261125.db`.
- Branch `docs/reopen-38` (pushed): spec 38 back to `review`, master rows 36 and 37 `parked`. **PR 88 open, not merged**: GitHub API returned 5xx on merge (graphql and REST). Retry `gh pr merge 88 --squash --delete-branch`; main still shows 38 `done` and 36/37 `draft` until then.

## Left

- Merge PR 88 (also carries this handoff).
- Spec 39 `39-month-journey` per the approved plan `~/.claude/plans/etant-donn-e-que-c-est-pure-deer-of-9a2ed560-ac47-4366-8cef-49dcffc73cfa.md`: Advisor writes the sub-spec and Frame, locked red tests for months X, X+1, X+2, then `test-lock.sh`.

## Decisions (human, 2026-11-25)

- Budget is read at the start of the month. Preparing month M gives each account its logical start balance (default = computed, editable).
- Deferred-debit current account: a negative balance at month end is repaid at month end, never carried into M+1.
- Fixed items without end date carry over; the one-off expense (`ONE_OFF`) and the overdraft do not.
- The CSV is out of scope until the user uploads it from the app at month end.
- Logical start balance is not a `BalanceSnapshot` (would zero `computeStatementGap`). A Prisma migration would be a GIT-7 human gate.

## Findings (verified)

- -419,24 EUR = non-savings balances today (~3 343) minus the 15 November payments, all `PENDING` (3 762,62). Card sub-lines (dues, net worth, reste à vivre) follow the current month, not the cursor.
- December has 15 payments; the projection does subtract charges.
- `Grady - BNP` is not flagged `deferredCard`. Budget card shows « CHF » next to a EUR total (`budget-preparation-card.tsx:96`).
- `/budget/2026-12` is not rejected by the page; preparing a future month needs an in-app check.
- DB holds no CSV data (6 transactions: salary, internal transfers).

## Files touched

- `specs/38-projected-balance.md`, `specs/SPEC_MASTER.md` (rows 36, 37, 38), `docs/handoffs/20261125-1700-38-projected-balance.md`.

## Tests

None run this session beyond `__tests__/scenarios` (30 passed). `test-lock.sh` not run on PRs 83, 84.

## Next action

Merge PR 88, then write spec 39 and lock its red tests.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261125-1700-38-projected-balance.md
Sub-spec: specs/39-month-journey.md (to write; master: specs/SPEC_MASTER.md)
First action: Merge PR 88 (retry), then write specs/39-month-journey.md and lock the X / X+1 / X+2 red tests.
Stop: none
```
