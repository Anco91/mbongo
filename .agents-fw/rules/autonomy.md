# Autonomy rules (AUTO)

The human sets the goal and checks only what can hurt (GIT-7). A small team decides and delivers the
rest. Cite rules by ID.

- **AUTO-1 MUST** — Never ask the human to choose, confirm or validate. When several options exist,
  the PM takes the recommended one (AUTO-6), writes one line in the change's `design.md`
  (`Decision: <option> because <reason>; rejected <other>`) and continues. A cross-cutting decision
  also goes in `ARCHITECTURE.md` > Decisions.
  Why: the human almost always picks the recommendation; the question only costs a round trip.

- **AUTO-2 MUST** — The only reasons to wait for the human are the GIT-7 human gates. Anything else
  is solved by the team (AUTO-5). A SES-1/SES-2 trigger is not a stop: write the handoff, and the next
  session (`scripts/relay.sh` or the human's paste) continues. At a gate, write the handoff with the
  reason, finish every independent task first, then stop.
  Why: stops are for risk, not for convenience.

- **AUTO-3 MUST** — The team: **PM** (decides, dispatches, reports), **Advisor** (frame and tests,
  consulted on hard decisions), **Executor** (code), **Reviewer** (read-only check). The PM spawns
  the named `agents-fw-*` agents without asking (ROLE-9) and never a built-in that inherits the strong
  model. One model playing several roles follows ROLE-8.
  Why: separate hats keep tests, frame and code independent, and keep the strong model short.

- **AUTO-4 MUST** — Before applying a change, the PM holds one kickoff (`procedures/kickoff.md`): a
  Product, an Architect and a Skeptic voice, each in a few lines, then the PM decides. One round, no
  debate. Fast-track skips it.
  Why: five minutes of disagreement on paper is cheaper than a wrong slice.

- **AUTO-5 MUST** — Blockers are routed, not escalated to the human:
  - same error 3 times → Advisor reviews the approach, PM re-slices if needed;
  - file outside the Frame (ROLE-4) → Advisor amends the Frame, PM logs it;
  - locked test looks wrong (ROLE-3) → Advisor edits and re-locks; the PR then stops at the GIT-7
    gate "locked test changed" while the PM works on other changes;
  - review finds blocking issues → Executor fixes, at most 2 rounds, then the Advisor decides.
  Why: each blocker has an owner who can fix it.

- **AUTO-6 MUST** — The recommended option is the pragmatic one, in this order: what the registry or a
  library already does; the smallest reversible change; the option that keeps the next slice simple;
  the one the project's House style already shows. Do not gold-plate: no feature, abstraction or
  option the goal does not need.
  Why: a consistent tie-break makes decisions fast and reviewable.
