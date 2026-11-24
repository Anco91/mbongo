---
id: transfer-any-account
status: ready
branch: feat/transfer-any-account
tier: medium
locked_at: 98dcc8d
locked_tests:
  - apps/web/__tests__/transfer-accounts.test.ts
  - apps/web/__tests__/transfer-form-schema.test.ts
---

# Frame — transfer-any-account

OpenSpec change `openspec/changes/transfer-any-account/` (proposal, design, tasks, delta). Master row 22. Rules WF-3, ROLE-1..4, TEST-5.

## Summary

Un transfert peut relier deux comptes ouverts quelconques (tout membre, toute devise). Même devise : sans taux ni frais, crédité aussitôt. Devises différentes : taux et frais comme avant. Aucune migration.

## Frame

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/domain/transfer-accounts.ts` | replace stubs with the real rules (signatures unchanged) |
| `apps/web/src/components/transfers/transfer-create-form.tsx` | `buildTransferFormSchema(accounts)` keeps its signature, uses `checkTransferAccounts`; selects list all open accounts; same currency hides rate/preview and submits rate 1 |
| `apps/web/src/server/transfers/transfer.service.ts` | `create`: `checkTransferAccounts` -> 422 `HttpError`; same currency => status COMPLETED, `settleSameCurrencyTransfer`, receivedAt = sentAt, both legs (SOURCE -sent, TARGET +received) in one `$transaction` |
| `ARCHITECTURE.md` | registry row for `transfer-accounts.ts` |
| `openspec/changes/transfer-any-account/tasks.md` | tick |

Modify (Advisor only, never the Executor): `specs/current/transfer-management/spec.md`.

### Reuse
`counterValue`, existing `createTransferSchema`, form kit, `useAccounts`. Forbidden: schema/migration changes, other files, locked tests, new libraries.
Read allow-list: files above plus `packages/shared/src/domain/conversion.ts`.
Checks: npm run test, typecheck, lint, build.
