## Why

Review of merged rows 21, 23, 24, 25, 26 found: the auto-debit of a manual payment tick is orphaned or double counted (un-tick, unlink, edit, delete, reconcile, concurrent ticks); fullscreen member chips sit inside the pan/zoom area; a stale member selection empties the charts; a dev.db backup was committed.

## What Changes

- A manual tick marks its debit (`AUTO_DEBIT_NOTE`); un-tick, unlink, delete, edit and reconcile keep payment and debit coherent, atomically; tick is race-safe; `transactionId` is rejected on update; currency mismatch is a 422; a tick without `paidAt` stores the debit date.
- Fullscreen chart: member chips move to a toolbar outside the transformed area. Stale member selection falls back to the household. `FilterChips` gets `aria-pressed`.
- Tab pending pulse waits 100 ms (no flicker).
- `dev.db.bak*` untracked and ignored.

## Out of scope

nuqs for the member scope (not installed), colours of new categories, « hors comptes joints » hint.
