# Workflow rules (WF)

Levels: **MUST** blocks review. **SHOULD** may be broken if the deviation is written in the sub-spec
or in `ARCHITECTURE.md` > Decisions. **MAY** is an option. Cite rules by ID in reviews and commits.

## Spec first, sliced

- **WF-1 MUST** — Every feature goes through a sub-spec validated by the human before the first line of
  production code.
  Why: code written before the frame is agreed is the main source of drift and wasted tokens.

- **WF-2 MUST** — `specs/SPEC_MASTER.md` is an index: vision, invariants, glossary, ordered list of
  sub-specs with status (`draft | ready | in-progress | review | done`) and last handoff path.
  It holds no implementation detail.
  Why: the master is read often; detail there is paid for on every read and goes stale.

- **WF-3 MUST** — A sub-spec is self-contained (the Executor never needs the master), sliced
  vertically (one observable outcome, end to end), at most 150 lines, touching about 8 production
  files or fewer. Bigger: split it.
  Why: one sub-spec = one branch = one PR = one session. Small slices ship, review and resume fast.
  - Good: "List charges filtered by period" (schema + filter + service + route + list view).
  - Bad: "All the Prisma models", then "all the services", then "all the pages" (layer slicing:
    nothing is usable until the end, every session needs every layer in context).

- **WF-4 SHOULD** — Write in detail only the next one or two sub-specs. Later ones stay as one line in
  the master index.
  Why: what you learn shipping sub-spec 1 changes sub-spec 4.

## Fast-track

- **WF-5 MUST** — A change may skip the sub-spec only if ALL are true:
  - 3 files or fewer;
  - no new module, public file, schema, migration, route or dependency;
  - no business rule changed;
  - no locked test touched.
  Otherwise write a sub-spec (it can be short).
  Why: small fixes should be cheap; anything that changes the shape of the code needs a frame.

- **WF-6 MUST** — A fast-track leaves its trace in git: a Conventional Commit with the reason in the
  body and the trailer `Track: fast`. If the fix touches an item of the reuse registry, update
  `ARCHITECTURE.md` in the same commit.
  Why: git is the audit log. No extra YAML journal.
  ```
  fix(charges): round monthly total to cents

  Totals showed 3 decimals on the dashboard.

  Track: fast
  ```

## Sub-spec cycle

- **WF-7 MUST** — Order for each sub-spec:
  1. Advisor writes the sub-spec, its Frame and its tests (`procedures/write-sub-spec.md`,
     `procedures/write-tests.md`). Tests fail. Tests are committed and locked.
  2. Human validates the sub-spec.
  3. Executor implements inside the Frame (`procedures/execute.md`).
  4. Review by the Advisor or a Reviewer (`procedures/review.md`).
  5. `ARCHITECTURE.md` updated; `arch-check.sh` and `test-lock.sh` green.
  6. PR opened; sub-spec status `review`, then `done` when merged.
  7. Handoff (SES-1).
  Why: each step has one owner and one output; skipping one moves its cost to a later, more
  expensive step.

- **WF-8 SHOULD** — When the human asks for something outside the current sub-spec, add it as a new
  line in the master index instead of growing the current sub-spec.
  Why: scope creep is how sessions get long.
