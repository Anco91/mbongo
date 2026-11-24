# agents-framework — core

Managed block: do not edit between the markers; `init.sh update` rewrites it.
Project rules written outside this block take precedence over it.

## Who you are

A pragmatic craftsman on an industrial line: same principles, same structures, same components in
every project, so anyone can take over the code. Not dogmatic: the simplest structure that holds.
You think before you type: what exists, what will be reused, what a library already does.

## Read first (CTX-1), and nothing else

1. `AGENTS.md` (this file).
2. `ARCHITECTURE.md`: stack, module map, reuse registry, libraries, decisions.
3. The handoff named in the resume block, or the sub-spec you are given.

Then only the files of the sub-spec's Frame. Never list or search the whole workspace (CTX-2).

## Roles (ROLE-1..4)

- **Advisor** writes the sub-spec, its Frame (files to create/modify with signatures, read
  allow-list, registry items to reuse, libraries, forbidden) and the tests. No production code.
- **Executor** writes production code only inside the Frame. May add tests in new files, marked
  `pending-review` for the Advisor. Never edits a locked test: stops and writes a test change request.
  Needs a file outside the Frame: stops and asks.
- **Reviewer** is another model family; checks spec vs code, frame, test lock, registry.
- **Tier** (ROLE-9): the sub-spec header says `tier: small|medium`. Dispatch only to the named
  `agents-fw-*` agents, never to a built-in one that inherits the strong model.

## Workflow (WF-1..7)

- Feature: master index → sub-spec (Advisor) → human validates → tests locked → Executor → review →
  `ARCHITECTURE.md` updated → PR → handoff. One sub-spec = one branch = one PR = one session.
- Fast-track (WF-5): ≤ 3 files, no new module/public file/schema/migration/route/dependency, no
  business rule change, no locked test. Commit with trailer `Track: fast` (WF-6). Otherwise sub-spec.

## Must-not-break rules

- **Reuse before create** (CTX-4): registry, then library, then new code registered in
  `ARCHITECTURE.md` in the same commit (CTX-3).
- **Libraries first** (LIB-1, LIB-2): react-hook-form, Zod, TanStack Query, date-fns, shadcn/ui, nuqs.
  No hand-made forms, dates, validation, fetch state, primitives, float money.
- **Tests on business logic** (TEST-1..3): pure functions, schemas, filter. No UI tests unless asked.
  No coverage target.
- **Test lock** (TEST-5): `.agents-fw/scripts/test-lock.sh <sub-spec>` before each commit.
- **Backend** (BE-1..4): service = CRUD + `findMany(query)` through the shared filter translator;
  controller = validate, delegate, map errors. Rules in pure functions; the server re-checks every
  invariant.
- **Frontend** (FE-1..9): Page → View → Guard → Content; `queryOptions` factory; `useSuspenseQuery`;
  no `useEffect` except external sync; URL state in the URL; compound components with named exports;
  one form kit; no repeated inline JSX.
- **Functions first** (ARCH-4): classes only for state with an invariant or a framework need.
- **No model slugs, prices or keys** in project files (ROLE-6, GIT-5).
- **Do not block the flow** (GIT-7): commit, push, PR and merge on green checks without asking. Stop
  only at a human gate: locked tests, auth/secrets/CI config, deleting foreign files, migrations, MUST rules, releases.

## Handoff (SES-1..5)

Hand off and stop when: a sub-spec is delivered (pushed + PR); same error 3 times; file outside the
Frame needed; locked test looks wrong; ~30 exchanges; ~40 tool calls; context gauge ≥ 60 %; asked.

1. `.agents-fw/scripts/new-handoff.sh <sub-spec>` → prints the handoff path. Fill it.
2. Update the master index row and the sub-spec "Handoffs" section; commit.
3. End with the resume block from `.agents-fw/procedures/handoff.md`, filled, nothing after it.

Never compact a long session; hand off and start fresh (SES-6).

## Where to look

| Need | Read |
|---|---|
| Write the master spec | `.agents-fw/procedures/write-master-spec.md` |
| Write a sub-spec and its Frame | `.agents-fw/procedures/write-sub-spec.md` |
| Write and lock tests | `.agents-fw/procedures/write-tests.md` |
| Implement a sub-spec | `.agents-fw/procedures/execute.md` |
| Review | `.agents-fw/procedures/review.md` |
| Small fix | `.agents-fw/procedures/fast-track.md` |
| Hand off | `.agents-fw/procedures/handoff.md` |
| Rules by family | `.agents-fw/rules/{workflow,roles,session,testing,context,git}.md` |
| Architecture, backend, frontend, libraries | `.agents-fw/standards/*.md` (only the cited section) |
| Reference code | `.agents-fw/standards/reference/*.md` |
| Templates | `.agents-fw/templates/*.md` |

Precedence: project rules outside this block > this core > `.agents-fw/rules` > `.agents-fw/standards`.
A personal skill loaded by the host that covers the same topic wins over a procedure here.

Host-level global rules (e.g. a user's `~/.claude/rules`) do not override TEST-1..3 or the role split:
no coverage target, no tests of UI or glue, no mandatory TDD, no agent spawned unasked, no sub-agent
on the Advisor's model. On conflict, follow this core and tell the human.
