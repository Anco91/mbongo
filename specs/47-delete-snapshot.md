---
id: 47-delete-snapshot
status: done
branch: spec/47-delete-snapshot
tier: small
locked_at: c166070b6cc743cf3a5f06ef6aebe2f68be43bb3
locked_tests:
  - apps/web/__tests__/snapshot-delete.service.test.ts
---

# 47 — Supprimer un relevé de solde (BalanceSnapshot)

Master: `specs/SPEC_MASTER.md` row 47 · Needs: 45 · Rules: WF-3, BE-1..4, TEST-1..5

## Summary

- Pourquoi : un relevé enregistré par erreur (doublon) fausse l'écart de relevé du compte et ne peut pas être retiré.
- Ce qui change : `DELETE /api/snapshots/{id}` supprime un relevé ; hook `useDeleteSnapshot`. Aucune liste de relevés n'existe dans l'UI, donc aucun bouton.
- Changement de comportement visible : non pour l'écran (API + hook seulement). Capability `bank-import` complétée (SPEC-3).

## Kickoff

- Product : plus petite tranche = suppression d'un relevé par id. Hors périmètre : liste/bouton UI, modification d'un relevé.
- Architect : calque de `charges` (service.delete, controller 204, route `[id]`, repository `delete`, hook mutation) ; contrat `SnapshotHttp.delete`. Risque : le dossier `snapshots/[id]` n'existe pas (GET `[id]` du contrat `findOne` n'a pas de route) : ne créer que DELETE.
- Skeptic : id inconnu → 404 sans appel `delete` ; seule la ligne ciblée est touchée (`delete({ where: { id } })`, jamais `deleteMany`) ; aucune transaction ni autre donnée touchée.

## Decisions (PM)

- 204 sans corps (`toNoContentResponse`), comme les autres suppressions. Inconnu → `NotFoundError` (404).
- Pas de bouton : aucune liste de relevés dans l'UI.
- Nettoyage de données dev (relevé en double) fait après merge via l'API, une seule ligne.

## Acceptance criteria

1. `apps/web/__tests__/snapshot-delete.service.test.ts` passe (verrouillé).
2. `DELETE /api/snapshots/{id}` : 204 ; inconnu : 404.
3. `useDeleteSnapshot()` invalide `snapshotQueries.all()`.
4. Typecheck, lint, suite complète, `arch-check.sh` verts.

## Frame

### Create

| Path | Role | Exports |
|---|---|---|
| `apps/web/src/app/api/snapshots/[id]/route.ts` | wiring | `DELETE = (request, { params }: { params: Promise<{ id: string }> }) => params.then(({ id }) => snapshotsController.delete(id))`; style `app/api/charges/[id]/route.ts` |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/contracts/snapshots.http.ts` | `delete(id: string): Promise<void>` on `SnapshotHttp` |
| `apps/web/src/server/snapshots/snapshot.service.ts` | `async delete(id: string): Promise<void>`: `findUnique`, null → `NotFoundError('BalanceSnapshot', id)`, else `balanceSnapshot.delete({ where: { id } })` |
| `apps/web/src/server/snapshots/snapshots.controller.ts` | `async delete(id: string)`: delegate, `toNoContentResponse()`, errors via `toErrorResponse` |
| `apps/web/src/repositories/snapshots.repository.ts` | `delete(id)`: `request<void>('DELETE', \`/snapshots/${id}\`)` |
| `apps/web/src/hooks/use-snapshots.ts` | `useDeleteSnapshot()` mutation (variables = id), invalidates `snapshotQueries.all()` |
| `ARCHITECTURE.md` | one line in the registry (`snapshots` delete, spec 47) |
| `specs/SPEC_MASTER.md`, `specs/current/bank-import/spec.md` | **Advisor/PM only**; the Executor never edits them |

### Read (allow-list)

`ARCHITECTURE.md`, the files above, `apps/web/src/server/charges/charges.controller.ts`, `apps/web/src/app/api/charges/[id]/route.ts`, `apps/web/src/repositories/charges.repository.ts`, `apps/web/src/hooks/use-charges.ts`.

### Reuse

`NotFoundError`, `toNoContentResponse`, `toErrorResponse`, `request`, `snapshotQueries.all()`.

### Forbidden

Any other file; editing the locked test; UI components; `deleteMany`.

## Tests

### Locked

- `apps/web/__tests__/snapshot-delete.service.test.ts` — delete one row by id; unknown id → NotFoundError, no delete.

## Handoffs
