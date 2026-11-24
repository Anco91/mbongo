# Hand off a session

Use when: any SES-1 or SES-2 trigger fires. Role: any.
Rules: SES-1..6.

Triggers: sub-spec delivered (pushed + PR); same error 3 times; file outside the Frame needed;
locked test looks wrong; ~30 exchanges; ~40 tool calls; context gauge ≥ 60 %; the human asks.
Project thresholds may differ: see `ARCHITECTURE.md` > Decisions.

1. Commit or stash nothing half-done without saying so: commit work in progress on the branch with
   `wip:` or describe uncommitted files in the handoff.
2. Create the file: `.agents-fw/scripts/new-handoff.sh specs/NN-slug.md` → prints
   `docs/handoffs/<YYYYMMDD-HHMM>-NN-slug.md`.
3. Fill every section: trigger, done (with short SHAs), left (ordered), decisions (and where they are
   written), files touched, tests (command + result + test-lock output), blockers, next action.
4. Update `specs/SPEC_MASTER.md` row (status, last handoff path) and append the handoff path to the
   sub-spec "Handoffs" section (SES-5).
5. Commit: `docs(handoff): NN-slug <trigger>` with trailer `Spec: specs/NN-slug.md`. Push.
6. End the session with this block, filled, and nothing after it (SES-4):

```
NEXT SESSION
Role: <advisor|executor|reviewer>
Read: AGENTS.md, ARCHITECTURE.md, {{PATH}}
Sub-spec: {{SUB_SPEC}} (master: specs/SPEC_MASTER.md)
First action: <one sentence>
```

Replace `{{PATH}}` with the exact handoff path and `{{SUB_SPEC}}` with the exact sub-spec path.
Several handoffs exist: the master index row names the current one; the resume block names it too.
