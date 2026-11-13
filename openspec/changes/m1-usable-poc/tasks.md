# Tasks

## 1. Erreurs lisibles (D1 — fix P2003)

- [x] 1.1 Dans `server/common/http.ts`, ajouter la détection de `PrismaClientKnownRequestError` (P2003) dans `toErrorResponse` et la traduire en `HttpError(422)` ; vérifier par un test unitaire que P2003 → 422 et que NotFoundError reste 404
- [x] 1.2 Dans `charge.service.ts`, pré-valider l'existence de `input.accountId` (lookup `prisma.account.findUnique`) et lever `HttpError(422, "compte inconnu : {id}")` ; test unitaire du cas compte inconnu (plus de 500)
- [x] 1.3 Dans `snapshot.service.ts`, même pré-validation du compte (422 lisible) ; test unitaire
- [x] 1.4 Dans `account.service.ts`, pré-valider `memberId` si fourni (422 "membre inconnu") ; test unitaire
- [x] 1.5 Vérifier manuellement : `POST /api/charges` avec `accountId` fictif → 422 lisible (le scénario du bug initial ne donne plus de 500)

## 2. Wiring API manquant (D5)

- [x] 2.1 Créer `app/api/members/route.ts` (wiring pur de `membersController`) ; vérifier `curl /api/members` → 200 avec le seed
- [x] 2.2 Créer `app/api/accounts/route.ts` et `app/api/accounts/[id]/route.ts` (find, create, findOne, update, close, remove) ; vérifier `curl /api/accounts` → 200 et filtre `?currency=USD` → 400
- [x] 2.3 Créer `app/api/transfers/route.ts` et `app/api/transfers/[id]/route.ts` (find, create, findOne, update) ; vérifier `curl /api/transfers` → 200
- [x] 2.4 Créer `app/api/snapshots/route.ts` (find, create) ; vérifier `POST /api/snapshots` avec compte inconnu → 422 lisible
- [x] 2.5 Test d'intégration par route : chaque endpoint répond 200/400/404/422 selon le cas (contrats de `packages/shared/contracts`)

## 3. Dépendances front (D3)

- [x] 3.1 Ajouter `react-hook-form` + `@hookform/resolvers` à `apps/web/package.json` ; vérifier `npm install` réussit et `npm run build` passe

## 4. Repositories front typés (D6)

- [x] 4.1 Extraire le pattern de `use-charges.ts` en repositories dédiés `src/lib/repositories/` : `accounts`, `members`, `transfers`, `snapshots` (fetch + zod via les contracts) ; refactorer `use-charges.ts` pour utiliser le même pattern ; vérifier `npm run test` et le refetch de /charges
- [x] 4.2 Tests unitaires des repositories (mock fetch) : parsing des réponses et erreurs HTTP propagées

## 5. UI Comptes + membres

- [x] 5.1 `components/accounts/hooks/use-accounts.ts` : `useAccounts` (lecture) + `useCreateAccount`, `useCloseAccount` (mutations + invalidation) ; tests des hooks (mock repository)
- [x] 5.2 `components/members/hooks/use-members.ts` : `useMembers` (lecture seule) ; test
- [x] 5.3 `components/accounts/accounts-guard.tsx` (RSC + Suspense) et `accounts-view.tsx` : liste des comptes actifs avec nom, banque, devise, type, solde calculé via `computeBalance` (D2) ; compte `CLOSED` masqué ; test du calcul de solde affiché
- [x] 5.4 `components/accounts/account-create-form.tsx` : formulaire RHF + `createAccountSchema` (zodResolver), sélecteur de membre alimenté par `useMembers`, devise CHF/EUR, découvert, carte à débit différé ; test : soumission valide → 201, devise invalide → erreur zod bloquante
- [x] 5.5 Pages `app/(dashboard)/comptes/page.tsx` (guard + view) et `comptes/nouveau/page.tsx` (page dédiée création) + `error.tsx` ; vérifier manuellement le parcours création → liste

## 6. UI Charges — formulaire dédié (fix utilisateur du P2003)

- [x] 6.1 `components/charges/charge-create-form.tsx` : formulaire RHF + `createChargeSchema`, sélecteur de compte alimenté par `useAccounts` (comptes actifs), sections conditionnelles par type (récurrence / N échéances / fin d'engagement / date unique / date prévue + provision) ; test : soumission avec compte réel → charge + échéances générées, soumission sans compte → bloqué par zod
- [x] 6.2 Page `app/(dashboard)/charges/nouveau/page.tsx` ; remplacer le bouton placeholder `CreateChargeButton` (charges-view.tsx) par un lien vers la page dédiée ; vérifier qu'aucun `accountId` hardcodé ne subsiste
- [x] 6.3 Vérifier le parcours complet : créer une charge `FIXED_RECURRING` sur UBS Courant → visible dans la liste avec ses échéances

## 7. UI Transferts

- [x] 7.1 `components/transfers/hooks/use-transfers.ts` : `useTransfers`, `useCreateTransfer` (phase 1), `useCompleteTransfer` (phase 2 via PATCH) + invalidation ; tests des hooks
- [x] 7.2 `components/transfers/transfers-guard.tsx` et `transfers-view.tsx` : liste des transferts avec statut Estimé/Réalisé, les deux phases côte à côte, mention "en attente du crédit" si non finalisé ; action "Enregistrer le crédit" (formulaire local : montant EUR crédité + date) sur les transferts estimés ; test : compléter un transfert → statut Réalisé, taux effectif et frais affichés
- [x] 7.3 `components/transfers/transfer-create-form.tsx` : formulaire RHF + `createTransferSchema` (source CHF, cible EUR, montant, taux de référence + date) ; contre-valeur estimée affichée avant soumission (fonction `counterValue` de `packages/shared`) ; test : source EUR → rejet zod avant envoi
- [x] 7.4 Page `app/(dashboard)/transferts/page.tsx` + `error.tsx` ; vérifier manuellement le flux : phase 1 estimé → transaction de débit sur la source → phase 2 → transaction de crédit sur la cible

## 8. Intégration — flux M1 de bout en bout

- [x] 8.1 Script de vérification manuelle du scénario du cahier des charges M1 : compte CHF → charge fixe → transfert phase 1 → phase 2 → soldes cohérents sur la liste de comptes (salaire − charges − transfert)
- [x] 8.2 `npm run quality` (lint + format + typecheck) et `npm run test` avec coverage ≥ 80 % sur les fichiers touchés
- [x] 8.3 Vérifier `npm run build` sans erreur (build de production Next.js)

## Workflow follow-up

- Faire relire le change (proposal/specs/design/tasks) avant archivage.
- Archiver le change via `openspec-archive-change` une fois les tâches terminées.
- Le change suivant (M2) planifiera : échéancier visuel, carte à débit différée (encours + échéance auto), capital restant dû.
