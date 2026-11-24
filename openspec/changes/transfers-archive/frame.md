---
id: transfers-archive
status: ready
branch: feat/transfers-archive
tier: medium
locked_at: d5a7b16
locked_tests:
  - apps/web/__tests__/transfer-archive.test.ts
  - apps/web/__tests__/transfer.service.test.ts
---

# Frame — transfers-archive

OpenSpec change `openspec/changes/transfers-archive/`: goal in `proposal.md`, acceptance criteria in
`specs/*/spec.md`, checklist in `tasks.md`. Rules: WF-3, WF-9, ROLE-1..4, TEST-1..5. Master row 09.

## Summary

La page Transferts permet de clore un transfert (statut `CLOSED`) ; les transferts clos sont masqués par défaut, avec une case pour les afficher. Un transfert clos ne peut plus être finalisé (409) et son taux effectif reste utilisable comme taux de repli. Aucune migration.

## Frame

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `apps/web/src/app/api/transfers/[id]/close/route.ts` | route wiring | `POST = async (_request: Request, { params }: Context): Promise<NextResponse> => transfersController.close((await params).id)` |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/schemas/transfer.ts` | `CLOSED` already added to `transferStatusSchema` (stub commit); update the file header comment only |
| `packages/shared/src/domain/transfer-archive.ts` | STUB: replace both bodies. `isTransferClosed(t) = t.status === 'CLOSED'`; `filterVisibleTransfers(transfers, showClosed)` returns a new array, order kept |
| `packages/shared/src/lib/calculation/consolidated.ts` | `findLatestRate`: realized filter accepts `COMPLETED` or `CLOSED` with `rateEffective !== null`; update the TSDoc |
| `apps/web/src/server/transfers/transfer.service.ts` | STUB `close(id: string): Promise<Transfer>`: replace body (not found → `NotFoundError('Transfer', id)`; already `CLOSED` → return it, no write; else `prisma.transfer.update({ where: { id }, data: { status: 'CLOSED' } })`, no transaction touched). `update`: `existing.status === 'CLOSED'` → `HttpError(409, 'Transfer is closed')` before any write |
| `apps/web/src/server/transfers/transfers.controller.ts` | `close(id: string): Promise<NextResponse>` → `toSuccessResponse(await this.transfers.close(id))`, errors via `toErrorResponse` |
| `packages/shared/src/contracts/transfers.http.ts` | `closeTransfer(id: string): Promise<Transfer>` |
| `apps/web/src/repositories/transfers.repository.ts` | `closeTransfer(id)` = `POST /transfers/${id}/close`, parse with `transferSchema` |
| `apps/web/src/hooks/use-transfers.ts` | `useCloseTransfer()` mutation (invalidate `transferQueries.all()`), same shape as `useCompleteTransfer` |
| `apps/web/src/components/patterns/show-closed-toggle.tsx` | optional prop `label?: string`, default « Afficher les comptes clôturés » (existing callers unchanged) |
| `apps/web/src/components/transfers/transfers-content.tsx` | `useState(false)` `showClosed`; `filterVisibleTransfers(transfers, showClosed)` before `ShowMoreList`; `<ShowClosedToggle label="Afficher les transferts clos" …/>` above the list; badge « Clos » when `CLOSED`; button « Clore » (variant outline, size sm) on non-closed cards calling `useCloseTransfer`; phase-2 form only for `ESTIMATED`; extract `CloseTransferButton` in the same file (FE-9); empty-state text unchanged |
| `ARCHITECTURE.md` | registry row `domain/transfer-archive.ts` (same commit); mention `label` in the `ShowClosedToggle` row |
| `specs/current/transfer-management/spec.md` | Advisor only, at review (SPEC-2/3) |

### Read (allow-list)

- `ARCHITECTURE.md`
- `apps/web/src/server/transfers/{transfer.service.ts,transfers.controller.ts}`
- `apps/web/src/app/api/transfers/[id]/route.ts`
- `packages/shared/src/{schemas/transfer.ts,contracts/transfers.http.ts,domain/transfer-archive.ts,lib/calculation/consolidated.ts}`
- `apps/web/src/{repositories/transfers.repository.ts,hooks/use-transfers.ts,queries/transfers.ts}`
- `apps/web/src/components/transfers/transfers-content.tsx`, `apps/web/src/components/patterns/show-closed-toggle.tsx`
- `apps/web/src/components/accounts/accounts-content.tsx` (toggle usage exemplar)

### Reuse (from the registry)

- `ShowClosedToggle` (extended with `label`), `Button`, `StatusBadge` (default grey for « Clos »), `transferQueries.all()`, `toSuccessResponse` / `toErrorResponse`, `HttpError` / `NotFoundError`, `useCompleteTransfer` as hook exemplar.

### Style exemplars

- `apps/web/src/server/transfers/transfer.service.ts` (`update`) — service method.
- `apps/web/src/hooks/use-transfers.ts` (`useCompleteTransfer`) — mutation hook.
- `packages/shared/src/domain/income-link.ts` — pure domain file.

### Libraries

- None new.

### Forbidden

- Prisma schema or migration, `updateTransferSchema`, the `PATCH` route behaviour other than the new 409, deleting or creating transactions on close, any filter on the API list, `useEffect`, a new date helper, a second toggle component. Any file not listed: stop and ask.

## Tests

### Locked

- `apps/web/__tests__/transfer-archive.test.ts` — `findLatestRate` (CLOSED realized), `isTransferClosed`, `filterVisibleTransfers` (TEST-1).
- `apps/web/__tests__/transfer.service.test.ts` — 409 on completing a CLOSED transfer, `close` rules (TEST-3, risky boundary).

Stubs the Executor replaces: `domain/transfer-archive.ts`, `TransferService.close`.

Proof of failure: `cd apps/web && npx jest __tests__/transfer-archive.test.ts __tests__/transfer.service.test.ts` → 14 failed, 3 passed (the 3 regression pins already hold).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Handoffs

- `docs/handoffs/20261124-2235-09-transfers-archive.md`
