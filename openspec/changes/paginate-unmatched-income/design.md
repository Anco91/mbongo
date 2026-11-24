## Decisions (AUTO-1)

- Filtre serveur via `GET /api/transactions` et le where-translator existant (opérateurs du filtre générique) : à vérifier à l'explore que `incomeId`/`transferId` nuls et `amount > 0` sont exprimables; sinon l'Executor s'arrête et demande un ajout au translator (hors Frame).
- Pagination = `cursor` déjà supporté par `transaction.service.findMany`; côté client `useInfiniteQuery` via une factory `transactionQueries` (FE-1), pas de clé en dur.
- Taille de page 50; `UNMATCHED_QUERY` (limit 500) est remplacé.
- `findUnmatchedIncome` s'applique page par page cumulée : les propositions dépendent des sources, pas des autres transactions.
- Pas de mise à jour optimiste : invalidation comme avant.

## Risks

- Ordre des pages stable (date décroissante, puis id) : à vérifier dans le service avant de dépendre du curseur.

- Decision (AUTO-1): HTTP cannot carry null (`lib/api.ts` skips it), so the client sends the string `'null'` (`NULL_FILTER_VALUE`) and the server field map turns it into a real null; rejected changing `lib/api.ts` (shared, out of Frame).
- Decision: server logic moves to a pure `buildTransactionFindArgs` so it is testable without Prisma; order `date desc, id desc`, cursor with `skip: 1`.
- Decision: closed-account filtering stays client side; an empty cumulated list with `hasNextPage` shows « Afficher plus » instead of the empty state.
- Guard prefetches the first page with the SAME key as `useInfiniteQuery` (`PrefetchEntry` is `prefetchQuery`: Executor prefetches the first page under the infinite key via `{ pages: [page], pageParams: [undefined] }` shape; if PrefetchGuard cannot, extend it in `prefetch-guard.tsx` generically, in Frame).
