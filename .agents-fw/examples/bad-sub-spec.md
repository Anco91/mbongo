# Bad sub-spec — annotated

The same feature as `good-sub-spec.md`, written the way that makes a cheap model drift.
Each `>` note names the broken rule.

---

# Filters

> No header: no `id`, no `locked_tests`, no `locked_at`. `test-lock.sh` cannot run (TEST-5).

We need better filtering in the app. Add date filters everywhere and make it nice and fast.

> Not one observable outcome; "everywhere" is unbounded (WF-3). "Nice and fast" is not checkable.

## Tasks

1. Update all Prisma models to support date filters.
2. Update all services.
3. Update all pages with a date picker.

> Layer slicing: nothing usable until task 3, and every session needs every layer (WF-3).

## Notes

- Use whatever date library you prefer.
- Look around the codebase to see how filters are done.
- Write tests for the components and make sure coverage is above 90 %.

> No Frame: no paths, no signatures, no allow-list, no reuse (ROLE-1).
> "Whatever library": LIB-1 decided it already (date-fns).
> "Look around the codebase": workspace scan (CTX-2); `ARCHITECTURE.md` exists for that.
> Component tests and a coverage target: TEST-2, TEST-3.
> Tests left to the Executor: nothing constrains it (ROLE-1, TEST-4).
