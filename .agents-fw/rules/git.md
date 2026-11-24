# Git rules (GIT)

Git is the audit log. No side journal. Cite rules by ID.

- **GIT-1 MUST** — One sub-spec = one branch `feat/<id>-<slug>` (or `fix/`, `chore/`) = one PR.
  Commits follow Conventional Commits and carry the trailer `Spec: specs/<id>-<slug>.md`.
  Why: `git log --grep "Spec: specs/03"` returns the whole history of a feature.
  ```
  feat(charges): filter charges by period

  Spec: specs/03-charges-period-filter.md
  ```

- **GIT-2 MUST** — A PR description follows `templates/PR.md`: sub-spec, changes, checks
  (`test-lock.sh`, `arch-check.sh`, tests), rule deviations.
  Why: the reviewer checks the frame, not only the diff.

- **GIT-3 SHOULD** — Small atomic commits: the locked tests commit first (Advisor), then code commits
  (Executor), then registry/docs. Audit with `git log --grep "Spec: "` or `--grep "Track: fast"`.
  Why: `locked_at` points to a clean commit; reverts stay surgical.

- **GIT-4 MUST** — Never push directly to the default branch, never merge with failing checks, never
  rewrite shared history. Work reaches the default branch only through a PR.
  Why: the PR is the audit unit; CI is the gate.

- **GIT-5 MUST** — Never commit secrets, `.env` files, API keys, or raw conversation dumps.
  Why: keys leak and get used; dumps are noise.

- **GIT-6 SHOULD** — Delete the branch after merge; one open branch per active sub-spec.
  Why: stale branches hide which work is live.

- **GIT-7 MUST** — The flow does not wait for the human. Commit, push, open the PR and merge it
  yourself once all checks pass (and the Reviewer approved, when a review is due). Do not ask first.
  Stop at the PR, state why, and wait for the human only for a human gate:
  - a locked test changed, or `test-lock.sh` fails;
  - auth, permissions, secrets or CI/deploy configuration changed;
  - a file the agent or framework did not create is deleted or overwritten;
  - a database migration or any irreversible data change;
  - a line budget raised or a MUST rule changed (unless the human asked for that change);
  - a release, tag or publish.
  Why: routine delivery must not stall on approval; the human checks only what can hurt.
