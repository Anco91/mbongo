---
id: <change-id>
status: draft
branch: feat/<change-id>
tier: medium
locked_at:
locked_tests: []
---

# Frame — <change-id>

OpenSpec change `openspec/changes/<change-id>/`: goal in `proposal.md`, acceptance criteria in
`specs/*/spec.md`, checklist in `tasks.md`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5.

## Frame

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

### Reuse (from the registry)

- `path/to/registered/helper.ts` — <why it fits>

### Style exemplars

- `path/to/exemplar.ts` — <House style exemplar per new file; ROLE-10>

### Libraries

- <library> — <use>

### Forbidden

- Any file not listed above. Editing files listed in `locked_tests`.

## Tests

### Locked (written by the Advisor, failing before execution)

- `path/to/file.test.ts` — <what it pins>

Proof of failure: `<test command>` → `<N failing>`

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Handoffs
