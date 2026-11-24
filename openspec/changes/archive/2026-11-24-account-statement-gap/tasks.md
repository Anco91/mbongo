## 1. Domaine
- [x] 1.1 `computeStatementGap` dans `packages/shared/src/domain/balance.ts` (réutilise `computeBalance`, `computeSnapshotGap`), export barrel
## 2. Données
- [x] 2.1 `snapshotQueries` (`all`, `list`) dans `apps/web/src/queries/snapshots.ts`
- [x] 2.2 `useSnapshots` dans `apps/web/src/hooks/use-snapshots.ts`
## 3. Écran
- [x] 3.1 `buildAccountCards` reçoit les relevés, ajoute `statementGap` à `AccountCardView`
- [x] 3.2 `useAccountsView` charge les relevés
- [x] 3.3 `AccountCard` affiche la ligne d'écart
- [x] 3.4 `ARCHITECTURE.md` (registre + `snapshotQueries`), `npm run typecheck`, `npm run lint`
