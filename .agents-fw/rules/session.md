# Session rules (SES)

Every agent turn re-sends the whole conversation. A long session costs more per turn and drifts.
Short sessions with a written handoff are cheaper and more reliable. Cite rules by ID.

## When to hand off

- **SES-1 MUST** — A delivered sub-spec (last commit pushed, PR opened, status `review` or `done`)
  always triggers a handoff, even if the session is short. The next sub-spec starts in a new session.
  Why: the next slice should not pay for the previous slice's context.

- **SES-2 MUST** — Write a handoff and stop as soon as any of these is true:
  - the same error after 3 attempts;
  - a file outside the Frame is needed (ROLE-4);
  - a locked test looks wrong (ROLE-3);
  - about 30 exchanges in the conversation (human messages + agent answers);
  - about 40 tool calls in the session;
  - the host's context gauge shows 60 % or more, when it has one;
  - the human asks.
  Projects tune these thresholds in `ARCHITECTURE.md` > Decisions.
  Why: these are observable. "When the context feels full" is not.

## How to hand off

- **SES-3 MUST** — Create the handoff with `.agents-fw/scripts/new-handoff.sh <sub-spec>`. It writes
  `docs/handoffs/<YYYYMMDD-HHMM>-<sub-spec-id>.md` from `templates/HANDOFF.md` (suffix `-2`, `-3` if
  needed) and prints the path. Fill every section: trigger, done, left, decisions, files touched,
  tests, blockers, next action.
  Why: one file per session, so several handoffs (several sub-specs, several sessions) never collide.

- **SES-4 MUST** — The last message of the session is this block, filled, and nothing after it:
  ```
  NEXT SESSION
  Role: <advisor|executor|reviewer>
  Read: AGENTS.md, ARCHITECTURE.md, <exact handoff path>
  Sub-spec: <exact sub-spec path> (master: specs/SPEC_MASTER.md)
  First action: <one sentence>
  Stop: none | done | human-gate: <reason>
  ```
  Why: the human pastes it into a new session; the exact paths remove any guess about which handoff
  and which spec to read.

- **SES-5 MUST** — Update the sub-spec's row in `specs/SPEC_MASTER.md` (status, last handoff path) and
  append the handoff path to the sub-spec's "Handoffs" section. Commit both with the handoff.
  Why: when several handoffs exist, the index says which one is current.

## Session hygiene

- **SES-6 MUST** — Never compact or summarise a long session to continue it. Hand off and start fresh.
  Why: summaries drop the precise details the next step needs; a fresh session reading a good
  handoff does not.

- **SES-7 SHOULD** — A sub-spec fits in one Executor session; two at most. Otherwise split it.
  Why: a slice that needs three sessions was not a slice.

- **SES-8 MUST** — A new session reads only what CTX-1 lists. It does not re-read old handoffs except
  the one named in the resume block.
  Why: old handoffs are history, not context.

## Automatic continuation

- **SES-9 SHOULD** — A running session cannot clear or restart itself. For an unattended run, the human
  starts `.agents-fw/scripts/relay.sh` once, with `AGENTS_FW_RELAY_CMD` set to the host's headless
  command (it reads the prompt on stdin). The script feeds each session the latest handoff's
  `NEXT SESSION` block and stops on `Stop: done`, `Stop: human-gate: <reason>`, a `.agents-fw/STOP`
  file, a session that writes no new handoff, or `--max` sessions (default 10). Never use a
  permission-bypass flag in that command; allow the needed tools by name.
  Why: fresh sessions are cheaper (SES-6); the relay makes them automatic without a human paste.
