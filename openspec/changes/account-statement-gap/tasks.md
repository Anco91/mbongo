## 1. Domaine
- [ ] 1.1 `computeStatementGap` dans `packages/shared/src/domain/balance.ts` (réutilise `computeBalance`, `computeSnapshotGap`), export barrel
## 2. Données
- [ ] 2.1 `snapshotQueries` (`all`, `list`) dans `apps/web/src/queries/snapshots.ts`
- [ ] 2.2 `useSnapshots` dans `apps/web/src/hooks/use-snapshots.ts`
## 3. Écran
- [ ] 3.1 `buildAccountCards` reçoit les relevés, ajoute `statementGap` à `AccountCardView`
- [ ] 3.2 `useAccountsView` charge les relevés
- [ ] 3.3 `AccountCard` affiche la ligne d'écart
- [ ] 3.4 `ARCHITECTURE.md` (registre + `snapshotQueries`), `npm run typecheck`, `npm run lint`
