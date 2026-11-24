---
id: domain-gaps
status: ready
branch: fix/transfer-legs-autodebit-marker
tier: small
locked_at: PENDING
locked_tests:
  - apps/web/__tests__/transfer-legs.test.ts
  - apps/web/__tests__/auto-debit-marker.test.ts
---

# Frame — domain-gaps

## Summary

Transfer leg check also flags closed-without-target and completed-without-amountReceived; the reserved auto-debit note is refused as user input. No behaviour change otherwise.

## Frame

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/transfer-legs.ts` | `TARGET_MISSING` when status is not ESTIMATED; add `'AMOUNT_RECEIVED_MISSING'` to `TransferLegIssue`, returned when status COMPLETED and `amountReceived === null` |
| `packages/shared/src/schemas/transaction.ts` | in `createTransactionSchema` extend `note` with a refine rejecting `value?.trim() === AUTO_DEBIT_NOTE` (import from `../domain/payment-debit`); `transactionSchema` stays untouched |
| `ARCHITECTURE.md` | registry line update if the transfer-legs line lists codes |

### Read

`packages/shared/src/domain/payment-debit.ts`, the two locked tests.

### Forbidden

Any other file, schema/migration, UI.

## Tests

Locked: `apps/web/__tests__/transfer-legs.test.ts` (3 cases added, none changed), `apps/web/__tests__/auto-debit-marker.test.ts` (new).

## Handoffs
