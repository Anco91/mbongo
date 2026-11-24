# Run the team (PM loop)

Use when: the human gave a goal or a master index with open rows, and wants it delivered. Role: PM.
Rules: AUTO-1..6, ROLE-9, ROLE-11, GIT-7, SES-1, SES-2.

1. Read `AGENTS.md`, `ARCHITECTURE.md`, `specs/SPEC_MASTER.md` (CTX-1). Goal without rows → explore it
   (`openspec-flow.md` step 2), cut vertical slices (WF-3), add rows. Detail only the next two (WF-4).
2. Take the next row: `ready` first, then `draft`. Independent rows may run in parallel worktrees.
3. As Advisor: propose, kickoff (`kickoff.md`), Frame, locked tests (`openspec-flow.md` steps 3-5).
4. Dispatch the Executor by the `tier:` of the Frame to `agents-fw-executor-small` or
   `agents-fw-executor` (ROLE-9). Give only the `frame.md` path and the `tasks.md` path.
5. Dispatch `agents-fw-reviewer` on the result. Blocking findings go back to the Executor, at most
   two rounds (AUTO-5).
6. Green checks and approved review → merge (GIT-7), archive the change, set the row `done`.
7. Blocker → route it (AUTO-5). Never ask the human to choose (AUTO-1).
8. SES-1/SES-2 trigger → handoff (`handoff.md`), end with the resume block; `relay.sh` or a fresh
   session continues at step 1.
9. Stop only when: every row is `done`; or the remaining work waits on a GIT-7 gate. Then report in
   five lines: delivered, decisions taken, gates waiting, risks, next step.

Never: write production code or locked tests as PM; spawn a built-in agent that inherits the strong
model; stop to ask which option is preferred.
