# Role rules (ROLE)

Three roles, defined by capability. One human validates. Cite rules by ID.

| Role | Model profile | Writes | Never writes |
|---|---|---|---|
| Advisor | strong reasoning, used in short bursts | sub-specs, Frame, tests, `ARCHITECTURE.md`, handoffs | production code |
| Executor | cheap "Flash" model, reliable tool calling | production code inside the Frame, new proposed tests | locked tests, files outside the Frame |
| Reviewer | another model family than the Executor | review notes | code |

- **ROLE-1 MUST** — The Advisor writes the sub-spec and its **Frame**: files to create (path, role,
  exports with signatures), files to modify (what and where), read allow-list, registry items to
  reuse, libraries to use, forbidden files and traps. The Advisor writes the tests. The Advisor writes
  no production code.
  Why: a cheap model follows a precise frame well and invents badly. The frame is where the
  expensive thinking goes; the tests make the frame executable.

- **ROLE-2 MUST** — The Executor writes production code only, only in the files of the Frame.
  It MAY add tests, only in new files, listed under "Proposed by the Executor" in the sub-spec with
  status `pending-review`. The Advisor accepts them (they join `locked_tests`) or rejects them.
  Why: extra tests are welcome, but tests the Executor writes for its own code can pin a wrong
  behaviour.

- **ROLE-3 MUST** — The Executor never edits or deletes a locked test. If it believes a test is
  wrong, it stops, writes a row in "Test change requests" (test, reason, proposal) and hands off.
  Only the Advisor edits a locked test, then re-locks (new `locked_at`).
  Why: a test that bends to the code no longer constrains the code. `test-lock.sh` checks this.

- **ROLE-4 MUST** — An Executor that needs a file outside the Frame stops and asks (handoff with a
  blocker). It does not add the file itself.
  Why: an unplanned file is usually duplicated code or a missed registry item.

- **ROLE-5 SHOULD** — The Reviewer is a model of another family than the Executor. Without one, the
  Advisor reviews in a fresh session.
  Why: a model reviewing its own family's output shares its blind spots.

- **ROLE-6 MUST** — Roles are configured by capability (reasoning, tool calling, structured output,
  price), never by a model slug written in the framework. A host's tier alias (`haiku`, `sonnet`) is
  allowed in an agent file; a provider/model slug is not. Check every slug, price and provider on the
  provider's site (e.g. openrouter.ai) before configuring it.
  Why: model names and prices change weekly; LLMs suggest obsolete or invented slugs. Aliases track the tier.

- **ROLE-7 SHOULD** — Use a local model or the editor's built-in completion for autocompletion.
  Never a paid chat model.
  Why: completion requests fire on every pause while typing.

- **ROLE-8 MUST** — When one model plays several roles (small project, single tool), it still switches
  explicitly: it ends the Advisor work with a commit and a handoff before acting as Executor.
  Why: the role boundary is what keeps tests and frame independent from the code.

- **ROLE-9 MUST** — Dispatch work only to the named framework agents, never to a built-in agent that
  inherits the parent model (`general-purpose`, `Plan`). The Advisor sets `tier: small|medium` in the
  sub-spec header: `small` = one file or a mechanical change, `medium` = the rest. Check that
  `CLAUDE_CODE_SUBAGENT_MODEL` is unset, since it can override an agent's `model:`.
  Why: a sub-agent without an explicit model runs on the strong Advisor model and costs 5-10x more.

- **ROLE-10 MUST** — Code follows the project's House style (`ARCHITECTURE.md` > House style). The
  Advisor names the exemplar to copy per new file in the Frame ("Style exemplars"). The Reviewer
  compares every new or changed file with that exemplar and the listed conventions, and reports each
  gap as a blocking `ROLE-10` finding. Reference code in `.agents-fw/standards/reference` is a model,
  not a replacement: the project's own style wins when they differ.
  Why: code that works but reads differently from the rest makes the project harder to navigate.
