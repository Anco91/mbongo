## Decisions (AUTO-1)

- Filtre serveur via `GET /api/transactions` et le where-translator existant (opérateurs du filtre générique) : à vérifier à l'explore que `incomeId`/`transferId` nuls et `amount > 0` sont exprimables; sinon l'Executor s'arrête et demande un ajout au translator (hors Frame).
- Pagination = `cursor` déjà supporté par `transaction.service.findMany`; côté client `useInfiniteQuery` via une factory `transactionQueries` (FE-1), pas de clé en dur.
- Taille de page 50; `UNMATCHED_QUERY` (limit 500) est remplacé.
- `findUnmatchedIncome` s'applique page par page cumulée : les propositions dépendent des sources, pas des autres transactions.
- Pas de mise à jour optimiste : invalidation comme avant.

## Risks

- Ordre des pages stable (date décroissante, puis id) : à vérifier dans le service avant de dépendre du curseur.
