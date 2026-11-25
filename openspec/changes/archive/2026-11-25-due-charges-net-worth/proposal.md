# Proposal — due-charges-net-worth

## Why

Net worth ignores charges due this month but not yet debited (`PENDING` payments), so it overstates what the household really holds. The dashboard also lacks a figure for what is left to live on.

## What changes

- New pure `computeDueCharges`: EUR total of current-month `PENDING` payments, excluding `provisioned` charges.
- New pure `computeNetOfDue`: net worth minus due charges (gross figure kept).
- New pure `computeRemainingToLive`: balances of `ACTIVE` non-`SAVINGS` accounts minus due charges.
- `WealthCard` shows « dont charges dues », the net total and « Reste à vivre (comptes) ».

## Out of scope

- Charge owner and member scope (row 31, change B).
- Overdue payments of earlier months: the dashboard only loads the current month's payments; revisit if needed.
- Any schema or migration change.
