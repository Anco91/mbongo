## Why

Row 15: a transfer has two legs in two currencies; nothing verifies each leg against the Transfer record (a leg edited by hand would silently drift). Rows 22/23 changed same-currency transfers: they settle at creation (rate 1, no fee, both legs).

## What Changes

- Pure shared `checkTransferLegs(transfer, legs)` returns the list of inconsistencies (codes), empty when consistent.
- Not wired to any screen (the master row asks for the check only); no schema change, no behaviour change.

## Out of scope

Surfacing the result in the UI, repair of drifted legs, summing legs.
