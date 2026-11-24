# Write a sub-spec and its Frame

Use when: the next master row must be detailed before execution. Role: Advisor.
Rules: WF-3, ROLE-1, ARCH-6, CTX-3, CTX-4, LIB-1..3.

1. Read `ARCHITECTURE.md`, the master row, and only the code folders this slice touches.
2. Default (WF-9): follow `openspec-flow.md`; goal and criteria live in the OpenSpec change and this
   procedure fills `frame.md`. Fallback without node: copy `.agents-fw/templates/SUB_SPEC.md` to
   `specs/NN-slug.md`. Fill the header `id`, `branch`.
3. Goal: one observable outcome. Acceptance criteria: given/when/then, each checkable.
4. Analyse reuse (ARCH-6) before writing the Frame:
   - what in the registry already does part of it (reuse or extend);
   - what a registry library covers (LIB-1);
   - what this slice creates that the next slices will reuse (make it shared now).
5. Write the Frame:
   - **Create**: exact path, role, exported signatures with types. Follow the standards' file
     layout (`standards/architecture.md`) and naming (`standards/typescript.md`).
   - **Modify**: path and what changes where.
   - **Read**: the allow-list; the smallest set the Executor needs.
   - **Reuse**: registry paths and why.
   - **Libraries**: which and for what. New dependency → Decisions row (LIB-3).
   - **Forbidden**: everything else, locked tests, and the traps you foresee
     ("no new date helper, use date-fns", "no useEffect", "no logic in the controller").
   - Cite the standard section the Executor must read (CTX-5), e.g. `frontend.md > Form kit`.
6. Size check: ≤ 150 lines, ≤ ~8 production files. Bigger → split into two rows.
7. Write the tests (`write-tests.md`), then set status `ready`, commit, ask the human to validate.

Frame quality test: could a cheap model implement it without opening any file outside the Read
list and without choosing a name, a path, or a library? If not, the Frame is not done.
