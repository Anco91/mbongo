# Write and lock tests

Use when: a sub-spec's Frame is written and before the Executor starts. Role: Advisor.
Rules: TEST-1..7, ROLE-2, ROLE-3, GIT-3.

1. From the acceptance criteria and the Frame signatures, list the behaviours to pin:
   P1 pure business functions, P2 schemas / filter / mappers, P3 a risky boundary only (TEST-1).
   No UI tests (TEST-2).
2. For each exported business function: nominal case, edges (empty, zero, limits, dates at month
   ends, time zones), error cases. Name tests after the rule (TEST-7).
3. Create the test files at the paths the Frame implies (next to the source or in `tests/`, as
   `ARCHITECTURE.md` says). Import from the future paths with the exact signatures of the Frame.
   Add only the minimum stubs the test runner needs to load (an exported function that throws
   `not implemented`), listed in the Frame as files the Executor replaces.
4. Run the tests: they must fail for the right reason (TEST-4). Paste command + short output in the
   sub-spec under "Proof of failure".
5. Commit only the tests and stubs: `test(<scope>): lock tests for NN-slug`, trailer `Spec: …`.
6. Put that commit's SHA in `locked_at` and the test paths in `locked_tests`. Commit the sub-spec.
7. Run `.agents-fw/scripts/test-lock.sh specs/NN-slug.md`: it must pass.

Reviewing Executor-proposed tests: read each `pending-review` file; accept (add to `locked_tests`,
new `locked_at`) or reject (delete the file, reason in the table). Test change requests: decide,
edit the locked test yourself if justified, re-lock, record the decision in the table.
