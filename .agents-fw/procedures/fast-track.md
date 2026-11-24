# Small fix without a sub-spec

Use when: a correction is small and clearly bounded. Role: Executor or Advisor.
Rules: WF-5, WF-6, CTX-3, GIT-5.

1. Check every WF-5 condition:
   - [ ] 3 files or fewer;
   - [ ] no new module, public file, schema, migration, route or dependency;
   - [ ] no business rule changed;
   - [ ] no locked test touched.
   One box unchecked → write a short sub-spec instead (`write-sub-spec.md`).
2. Read `ARCHITECTURE.md` and only the files to fix.
3. Fix. Run the project's tests, lint and typecheck.
4. If a registry item changed (signature, behaviour), update its line in `ARCHITECTURE.md`.
5. Commit on a `fix/<slug>` branch:
   ```
   fix(<scope>): <what>

   <why, in one or two lines: symptom and cause>

   Track: fast
   ```
6. Push, open a PR, merge it when checks pass (GIT-4, GIT-7). No YAML journal: `git log --grep "Track: fast"` is the audit.
