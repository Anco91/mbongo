## 1. Domaine
- [ ] 1.1 `transferStatusSchema` accepte `CLOSED`
- [ ] 1.2 `findLatestRate` compte `CLOSED` comme réalisé (`consolidated.ts`)
- [ ] 1.3 `isTransferClosed`, `filterVisibleTransfers` dans `domain/transfer-archive.ts`
## 2. Serveur
- [ ] 2.1 `transferService.close(id)`; `update` refuse un transfert clos (409)
- [ ] 2.2 `transfersController.close`, route `POST /api/transfers/{id}/close`
## 3. Client
- [ ] 3.1 contrat `closeTransfer`, repository, hook `useCloseTransfer`
- [ ] 3.2 `ShowClosedToggle` prop `label`; `TransfersContent`: bouton « Clore », case, filtre
- [ ] 3.3 `ARCHITECTURE.md` (registre), `npm run typecheck`, `npm run lint`
