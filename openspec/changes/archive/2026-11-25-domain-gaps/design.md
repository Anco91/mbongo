## Kickoff

- Product: smallest slice, two shared-package tweaks; unblocks nothing, removes two latent data-loss/consistency risks.
- Architect: pure code in `transfer-legs.ts`; marker guard lives in the shared transaction schema (single source of truth, FE and API both use it). Size: 3 files.
- Skeptic: the persisted `transactionSchema` must NOT refuse the marker (auto debits are read through it); only create/update inputs. Service code already requires the debit to be the one linked via `transactionId`.

## Decisions (AUTO-1)

- Decision: reject the reserved note at the input boundary (Zod refine on create/update, trimmed) because it needs no migration and closes the only way a user row can carry the marker; rejected a new `Payment.autoDebit` column or a payment-id suffix in the note (migration = human gate, legacy rows).
- Decision: new code `AMOUNT_RECEIVED_MISSING` (COMPLETED + null amountReceived); CLOSED with null amountReceived stays valid (closed without receipt); rejected flagging it.
- Test change table: `apps/web/__tests__/transfer-legs.test.ts` gets 3 new cases (existing cases untouched), re-locked; `auto-debit-marker.test.ts` new.
