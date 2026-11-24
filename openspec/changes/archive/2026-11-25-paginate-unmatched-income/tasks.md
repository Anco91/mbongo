## 1. Données
- [ ] 1.1 Explore: filtre `amount > 0`, `incomeId`/`transferId` nuls exprimable? ordre stable avec curseur?
- [ ] 1.2 Factory infinie dans `queries/transactions.ts`
- [ ] 1.3 `useUnmatchedIncome` en `useInfiniteQuery` (pages cumulées, `hasNextPage`, `fetchNextPage`)
## 2. Écran
- [ ] 2.1 Guard: prefetch de la première page
- [ ] 2.2 Content: bouton « Afficher plus » + `docs/LEXIQUE.md`
- [ ] 2.3 Retirer `UNMATCHED_QUERY` (limit 500)
- [ ] 2.4 `npm run typecheck`
