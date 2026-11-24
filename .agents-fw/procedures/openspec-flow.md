# OpenSpec flow (default spec workflow)

Use when: a feature or change needs a spec (anything not fast-track). Role: Advisor, then Executor.
Rules: WF-1, WF-3, WF-7, WF-9, ROLE-1..4, TEST-5.

A **sub-spec is an OpenSpec change**: `openspec/changes/<id>/`. Scripts take its `frame.md`.

| OpenSpec file | Holds |
|---|---|
| `proposal.md` | why, what changes, out of scope (the goal) |
| `specs/<capability>/spec.md` | delta requirements + scenarios (the acceptance criteria) |
| `design.md` | decisions, kickoff outcome, reuse analysis |
| `tasks.md` | ordered checklist the Executor ticks |
| `frame.md` | framework header (`id`, `status`, `tier`, `locked_at`, `locked_tests`) + Frame + Tests |

No stop between steps: choices follow AUTO-1; the only stops are GIT-7 gates.

1. **Bootstrap, once per project**: no `openspec/` folder → run `openspec init --tools <host>` (host
   `claude`, `kilo`, `codex`, `opencode`…; see `openspec init --help`). The CLI missing →
   `npx -y @fission-ai/openspec@latest init --tools <host>`. No node → use `templates/SUB_SPEC.md`
   under `specs/` instead (legacy fallback) and say so in `ARCHITECTURE.md` > Decisions.
   Never pass `--force`: it deletes legacy files.
2. **Explore** with the skill `openspec-explore` (or read the area per CTX-1..2). Output: findings in
   your head, nothing to approve.
3. **Propose** with the skill `openspec-propose`: `proposal.md`, spec deltas, `design.md`, `tasks.md`.
   `openspec validate <id>` must pass. One change = one vertical slice (WF-3). Then the PM holds the
   kickoff (`kickoff.md`) and writes its decisions in `design.md`.
4. **Frame**: copy `.agents-fw/templates/FRAME.md` to `openspec/changes/<id>/frame.md`; follow
   `write-sub-spec.md` steps 4-6 for the Frame content. Add a master row
   `openspec/changes/<id>/frame.md` in `specs/SPEC_MASTER.md`.
5. **Tests**: `write-tests.md`. Commit them, set `locked_at`, run `test-lock.sh`.
6. **Apply** with the skill `openspec-apply-change`, bound by the Frame (`execute.md`). Tick `tasks.md`.
7. **Review** (`review.md`), then merge on green (GIT-7).
8. **Archive** with the skill `openspec-archive-change`. It moves the folder to
   `openspec/changes/archive/<date>-<id>/`; in the same commit set the master row path to the new
   `frame.md` and status `done`. The change id never changes: use it to find the history.
9. Hand off (SES-1) and continue with the next row.

OpenSpec writes its own skills and an `openspec/config.yaml`; `init.sh` never touches `openspec/`.
