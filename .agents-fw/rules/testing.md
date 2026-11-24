# Testing rules (TEST)

Test what is cheap to test and expensive to get wrong: business logic. Not everything.
Cite rules by ID.

- **TEST-1 MUST** — Priorities:
  - P1 — pure business functions: calculations, rules, transformations, invariants.
  - P2 — validation schemas, the filter builder and translator, mappers.
  - P3 — integration at a boundary only when it carries a real risk (e.g. filter → SQL/ORM query,
    a money amount crossing an API).
  Why: P1 and P2 are fast, stable, and catch the bugs that cost money.

- **TEST-2 MUST** — No UI tests (render, DOM, JSX, styles, snapshots, visual) unless the human asks
  for them explicitly. Make UI logic testable another way: move it out of the component into a pure
  function and test that.
  Why: UI tests are slow, brittle, and break on every layout change while catching few real bugs.
  - Good: `getChargeStatus(charge, today)` in the domain lib, tested; the badge component just maps
    the status to a variant.
  - Bad: rendering `<ChargeBadge>` and asserting on a class name.

- **TEST-3 MUST** — No coverage threshold. Done means: every exported business function has tests
  for the nominal case, the edges and the error cases.
  Why: a percentage rewards testing getters and JSX; the criterion rewards testing rules.

- **TEST-4 MUST** — The Advisor's tests fail before execution. The sub-spec records the proof:
  command and short output (e.g. `vitest run src/domain/charge` → `6 failed`).
  Why: a test that already passes constrains nothing.

- **TEST-5 MUST** — The sub-spec header lists `locked_tests` (paths) and `locked_at` (SHA of the
  commit that locks them). `.agents-fw/scripts/test-lock.sh <sub-spec>` fails if any locked file
  differs from `locked_at`. The Executor runs it before each commit; the review runs it again.
  Why: the lock is checked by git, not by trust.

- **TEST-6 SHOULD** — Do not mock what you own. A pure function is tested without mocks; a boundary
  test uses a real test database or an in-memory fake, not a mock of your own service.
  Why: mocks of your own code test the mock.

- **TEST-7 SHOULD** — Name tests after the rule, not the function:
  `it("charges due on the 31st fall on the last day of shorter months")`.
  Why: a failing test should say which business rule broke.

- **TEST-8 MAY** — One end-to-end smoke test of the main user path, when the human asks for it.
