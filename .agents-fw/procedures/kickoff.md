# Kickoff before a change

Use when: a change is proposed and about to be applied (not for fast-track). Role: PM.
Rules: AUTO-1, AUTO-3, AUTO-4, AUTO-6.

One round, written, no human. Output: a `## Kickoff` section in `openspec/changes/<id>/design.md`.

1. **Product voice** (3-5 lines): is this the smallest slice that gives a visible result? What is
   explicitly out of scope? Which later row does it unblock?
2. **Architect voice** (3-5 lines, the Advisor; use the host's `advisor` tool or a fresh strong
   session when available): registry items to reuse, library that covers it (LIB-1), where the shared
   part should live now, size of the Frame (WF-3), main risk.
3. **Skeptic voice** (3-5 lines, the Reviewer, read-only): what can break, which edge or error case the
   tests must pin, which House style gap is likely (ROLE-10), what the slice must not touch.
4. **PM decision**: one line per open point, `Decision: <option> because <reason>; rejected <other>`
   chosen with AUTO-6. No second round: if two voices disagree, the AUTO-6 order decides.
5. Reflect the decisions: tighten `proposal.md` out-of-scope, Frame (`frame.md`) forbidden/reuse lists
   and `tasks.md` order. Cross-cutting ones also go to `ARCHITECTURE.md` > Decisions.
6. Continue to the Frame and tests (`openspec-flow.md` step 4). Do not report to the human.

One model, several voices: write the three sections one after the other, then decide (ROLE-8). Keep
the whole kickoff under 25 lines: it is a decision record, not a discussion.
