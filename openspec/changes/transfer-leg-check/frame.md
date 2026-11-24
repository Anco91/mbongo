---
id: transfer-leg-check
status: ready
branch: feat/transfer-leg-check
tier: small
locked_at: 2172023
locked_tests:
  - apps/web/__tests__/transfer-legs.test.ts
---

# Frame — transfer-leg-check (master row 15)

## Summary

Adds a pure check that each transfer leg matches its Transfer record. No behaviour change visible, not wired.

## Frame

### Create

| Path | Signature |
|---|---|
| `packages/shared/src/domain/transfer-legs.ts` | `checkTransferLegs(transfer: TransferLegsSource, legs: TransferLegInput[]): TransferLegIssue[]` (types exported, codes per design.md) |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/index.ts` | export the new module |
| `ARCHITECTURE.md` | registry line |

### Read

`packages/shared/src/domain/conversion.ts`, `transfer-accounts.ts`, the locked test.

### Reuse

`counterValue`, `transferFees`.

### Forbidden

Any other file, UI wiring, schema.

## Tests

Locked: `apps/web/__tests__/transfer-legs.test.ts`.

## Handoffs
