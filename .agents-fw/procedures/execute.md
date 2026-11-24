# Implement a sub-spec

Use when: a sub-spec has status `ready` and locked tests. Role: Executor.
Rules: ROLE-2..4, CTX-1..4, TEST-5, GIT-1, SES-1, SES-2.

1. Read `AGENTS.md`, `ARCHITECTURE.md`, the sub-spec (or the handoff). Nothing else yet.
2. `git switch -c <branch from header>` (or switch to it). Set status `in-progress`.
3. Read only the Read list and the standard sections cited in the Frame, plus the Frame's style
   exemplar. Write new files in that style (ROLE-10).
4. Implement file by file, in the order of the Frame. Exact paths, names and signatures.
   - Reuse what the Frame lists; use the libraries it lists.
   - Need a file outside the Frame, a new dependency, or a different signature: stop, handoff
     with blocker (ROLE-4).
5. Run the locked tests after each file. Make them pass by changing production code only.
   - A test looks wrong: stop, add a row in "Test change requests", handoff (ROLE-3).
   - Same failure 3 times: handoff (SES-2).
6. Extra tests you think are useful: new files only, add a row in "Proposed by the Executor",
   status `pending-review` (ROLE-2).
7. Before each commit: `.agents-fw/scripts/test-lock.sh <sub-spec>` and the project's tests, lint,
   typecheck. Commit with trailer `Spec: <sub-spec path>`.
8. Update `ARCHITECTURE.md` registry for every public file created; run
   `.agents-fw/scripts/arch-check.sh`.
9. Push, open the PR from `templates/PR.md`, set status `review`, then hand off (SES-1).

Never: edit a locked test, touch a file outside the Frame, search the whole workspace, add
`useEffect` to fetch or derive, write a date/form/validation helper by hand.
