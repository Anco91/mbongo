# Write the master spec

Use when: starting a project or a large feature set, before any sub-spec. Role: Advisor.
Rules: WF-2, WF-4, WF-8.

1. Read `AGENTS.md` and `ARCHITECTURE.md` only. Ask the human for what is missing: who, why, success.
2. Copy `.agents-fw/templates/SPEC_MASTER.md` to `specs/SPEC_MASTER.md` if it is still the template.
3. Fill Vision (5 lines max), Invariants (business and technical truths), Glossary (domain words).
4. List sub-specs as vertical slices, ordered by value and dependency:
   - each row is one observable outcome a user or a test can see;
   - first slice = the thinnest end-to-end path (schema → service → route → screen);
   - no row "set up all models" or "all pages" (layer slicing, WF-3).
5. Number them `01`, `02`… and name files `specs/NN-slug.md`. Status `draft`.
6. Write in detail only the first one or two (`write-sub-spec.md`). Others stay one line (WF-4).
7. Put cross-cutting decisions (stack, libraries, folder layout) in `ARCHITECTURE.md` > Decisions,
   not in the master.
8. Commit: `docs(specs): add master spec` and ask the human to validate.

Check before asking for validation:
- [ ] No implementation detail in the master.
- [ ] Every row has an observable outcome.
- [ ] The first slice is shippable alone.
