## Summary

Closes two minor domain gaps: the transfer leg check also catches a closed transfer without its TARGET leg and a completed transfer without `amountReceived`; and a user can no longer type the reserved auto-debit note, so a real transaction is never deleted on un-tick. No visible screen change except a validation error on that reserved note.

## What Changes

- `checkTransferLegs`: `TARGET_MISSING` also for `CLOSED`; new code `AMOUNT_RECEIVED_MISSING` for `COMPLETED` with null `amountReceived`.
- `createTransactionSchema` / `updateTransactionSchema` reject `AUTO_DEBIT_NOTE` (trimmed) as note.

## Out of scope

Migration, UI wiring of the leg check.
