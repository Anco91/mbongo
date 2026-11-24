# Context rules (CTX)

Context is the first cost. Read little, read the right thing, never scan. Cite rules by ID.

- **CTX-1 MUST** — At session start read, in order: `AGENTS.md`, `ARCHITECTURE.md`, then the handoff
  named in the resume block or the sub-spec. After that, read only files in the Frame's allow-list
  and files you are creating or modifying.
  Why: these three documents are written to be enough to start.

- **CTX-2 MUST** — Never list or search the whole workspace (`ls -R`, `find .`, repo-wide grep or
  glob). A search is limited to a folder named in `ARCHITECTURE.md` or in the Frame.
  Why: one repo-wide listing can cost more than the whole task, and it stays in context for every
  later turn.

- **CTX-3 MUST** — `ARCHITECTURE.md` is true at all times: stack, module map, declared folders, reuse
  registry (components, hooks, pure functions, schemas, backend helpers: path + one line), libraries,
  decisions. Any public file created, renamed or deleted updates it in the same commit.
  `.agents-fw/scripts/arch-check.sh` fails if a registry path no longer exists or if a file in a
  declared folder is missing from the registry.
  Why: it is the map that replaces scanning, and the list that prevents rewriting what exists.

- **CTX-4 MUST** — Before creating anything, look in the registry. If it exists, reuse or extend it.
  If not, and a library of the LIB registry covers it, use the library. Only then create it, and
  register it.
  Why: duplicated helpers are the most common drift of cheap models.

- **CTX-5 SHOULD** — Read standards (`.agents-fw/standards/*`) on demand, only the section the Frame
  cites (e.g. "frontend.md > Form kit").
  Why: the full standards are written for the Advisor; the Executor needs one section.

- **CTX-6 SHOULD** — Read a large file by symbol or line range (LSP / Serena / ranged reads) rather
  than whole.
  Why: a 600-line file read whole is re-sent on every following turn.

- **CTX-7 MUST** — Use up-to-date library docs (Context7 or the official docs) when writing code
  against a library API. Never rely on the model's memory for an API signature.
  Why: model memory is months old; library APIs are not.

- **CTX-8 SHOULD** — Pick tools in this order: the registry in `ARCHITECTURE.md`, then a ranged read
  or LSP / Serena (CTX-6), then a search limited to a declared folder (CTX-2), then Context7 or the
  official docs for library APIs (CTX-7). Move to the next step only when the previous one fails.
  Why: each step costs more context than the one before it.
