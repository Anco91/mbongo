# Handoff — generic-prefetch-guard — 2026-11-24 23:01

Sub-spec: `openspec/changes/generic-prefetch-guard/frame.md` · Rules: SES-1..5

## Trigger

Tool-call limit (SES-2) and usage limit reached. Spec written, not implemented.

## Done

- Rows 10, 10b merged (PR 52, 53, 54); migration applied; `dev.db.bak-20261124-215210` deleted (identical counts to live db).
- Rows 04 + 05 merged into one change `generic-prefetch-guard` (proposal, design, tasks, delta, Frame), committed on branch `refactor/generic-guard-list-query`. Master row 04 now `ready`, row 05 removed.

## Left

- Executor (tier medium): implement the Frame (PrefetchGuard + 9 guards), verify jest/tsc/lint/build, commit.
- Advisor: review, archive the change, row 04 done, PR, merge on green.
- Rows 15 and 20 stay deferred (triage 2026-11-24).

## New user requests (2026-11-24, now master rows 21-28, all draft)

Priority order: 21 performance (page changes very slow, no loading feedback), 22 transfer between any accounts, 23-24 consolidated balance and Sankey fake joint income (need 22), 25 member scope for donut/Sankey, 26 richer taxonomy, 27 delete closed test accounts/transfers (human authorised; back up dev.db first). Must be generic across members, not tied to one person. 28 unmatched-income alert counts an income on a closed account: must be excluded (small, quick win, can be fast-track if ≤ 3 files). Row 04 (generic-prefetch-guard) is ready but lower priority than 21.

## Next action

Dispatch `agents-fw-executor` on the Frame; branch already checked out, spec commit not yet pushed.

## Resume block

```
NEXT SESSION
Role: advisor
Read: AGENTS.md, ARCHITECTURE.md, docs/handoffs/20261124-2301-generic-prefetch-guard.md
Sub-spec: openspec/changes/generic-prefetch-guard/frame.md (master: specs/SPEC_MASTER.md)
First action: write row 21 (performance) change, then dispatch; generic-prefetch-guard Frame is ready on branch refactor/generic-guard-list-query.
Stop: none (no human gate)
```
