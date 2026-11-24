# Architecture — <Project>

Rules: CTX-1..4, ARCH-*, LIB-3. Read this before any search. Keep it true in the same commit as the code.
Checked by `.agents-fw/scripts/arch-check.sh`.

## Stack

<!-- Language, framework, ORM, test runner, package manager, runtime versions. -->
- <item>

## Module map

<!-- One line per module: path — responsibility — main collaborators. -->
- `path/` — <responsibility>

## Declared folders

<!-- One path per line, ending with `/`. Every non-test file inside must be covered by the registry. -->
<!-- Keep only folders that hold reusable code (domain, schemas, ui, patterns, server/common...). -->

## Reuse registry

<!-- Path to a file, or to a folder ending with `/` to cover everything inside. -->
| Path | Kind | Purpose |
|---|---|---|

## House style

<!-- The project's own style. The Executor copies it, the Reviewer checks it (ROLE-10). -->
<!-- Exemplars are registry paths: 2 to 5 files that show how code is written here, one per layer. -->
| Layer | Exemplar | What it shows |
|---|---|---|

<!-- Conventions the exemplars do not show: naming, error handling, file layout, comments, imports. -->
- <convention>

## Libraries

<!-- Retained libraries (LIB-1). Any addition needs a line in Decisions (LIB-3). -->
| Need | Library |
|---|---|

## Decisions

<!-- Date — decision — reason. Also: deviations from SHOULD rules, local signature, session thresholds. -->
| Date | Decision | Reason |
|---|---|---|
