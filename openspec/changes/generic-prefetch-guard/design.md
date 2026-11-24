## Decisions

- **`PrefetchGuard` générique, guards de domaine conservés comme déclarations.** Les pages et vues ne changent pas ; chaque guard ne fait plus que construire ses `entries`. Rejeté : supprimer les guards et mettre les entrées dans les pages (touche 8 pages, aucun gain de comportement).
- **Les entrées sont `{ queryKey, queryFn }`**, pas des `queryOptions` client : le `queryFn` serveur appelle les services directement (R5), la clé doit rester identique à celle de la factory `queries/`.
- **PaymentDetailGuard** garde ses lectures séquentielles (payment → charge → account) avant de déclarer les entrées.
- **BE-2** : `Filter` + `createWhereTranslator` + field map par service est le moteur unique et testé. Écart de nommage seulement avec `listQuerySchema`/`toPrismaArgs` : documenté, pas réécrit (YAGNI, aucun comportement gagné).

## Kickoff

**Product**: aucun changement visible.
**Architect**: un seul composant de mécanique, neuf déclarations.
**Skeptic**: clés de cache identiques à celles des hooks, sinon double fetch ; vérifier build + jest + tsc.
**Decisions**: ci-dessus.
