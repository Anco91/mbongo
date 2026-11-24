---
id: NN-slug
status: draft
branch: feat/NN-slug
tier: medium
locked_at:
locked_tests: []
---

# NN — <Title>

Master: `specs/SPEC_MASTER.md` · Rules: WF-3, WF-7, ROLE-1..4, TEST-1..5

## Goal

<One observable outcome, one or two sentences. Who gets what.>

## Acceptance criteria

<!-- Observable and checkable. Each one maps to a test or a manual check. -->
1. <Given / when / then>

## Frame

<!-- Written by the Advisor. The Executor touches nothing outside this section. -->

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `path/to/file.ts` | pure domain fn | `computeX(input: XInput): Result<X, XError>` |

### Modify

| Path | Change |
|---|---|
| `path/to/existing.ts` | <what changes, where> |

### Read (allow-list)

- `ARCHITECTURE.md`
- `path/to/file/needed/to/understand.ts`

### Reuse (from the registry)

- `path/to/registered/helper.ts` — <why it fits>

### Style exemplars

- `path/to/exemplar.ts` — <the House style exemplar to copy for each new file; ROLE-10>

### Libraries

- <library> — <what it is used for here>

### Forbidden

- Any file not listed above.
- Editing files listed in `locked_tests`.
- <specific trap: e.g. "no new date helper, use date-fns">

## Tests

### Locked (written by the Advisor, failing before execution)

<!-- Same paths as `locked_tests` in the header. Proof of failure: command + short output. -->
- `path/to/file.test.ts` — <what it pins>

Proof of failure: `<test command>` → `<N failing>`

### Proposed by the Executor

<!-- New files only. Status: pending-review | accepted | rejected (Advisor decides). -->
| Path | What it covers | Status |
|---|---|---|

### Test change requests

<!-- The Executor stops and writes here. Only the Advisor edits a locked test, then re-locks. -->
| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- <what this sub-spec explicitly does not do>

## Handoffs

<!-- Appended by new-handoff.sh users (SES-5): newest last. -->
