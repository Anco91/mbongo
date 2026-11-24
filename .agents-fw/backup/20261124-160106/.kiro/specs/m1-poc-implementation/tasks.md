# Implementation Plan: M1 Mbongo — Socle financier

## Overview

Implémentation du socle M1 de Mbongo en TypeScript/Next.js en suivant les jalons de la spec technique (`docs/specs/m1-poc/SPEC.md`). Le module `Charge`/`Payment` existant reste compilable tout au long. Les étapes sont séquencées pour que chaque incrément soit intégrable et vérifiable.

---

## Tasks

- [ ] 1. Schémas Zod partagés + domaine pur + contrats HTTP
  - [x] 1.1 Créer `packages/shared/src/schemas/member.ts` avec `memberSchema`, `createMemberSchema` et les types inférés
    - Champs : `id` (UUID), `firstName` (string min 1), `role` (enum `PRIMARY` | `PARTNER`), `createdAt`, `updatedAt` (isoDate)
    - Exporter `Member`, `CreateMemberInput`
    - _Requirements: 1.1, 1.10_

  - [x] 1.2 Créer `packages/shared/src/schemas/account.ts` avec tous les schémas de compte
    - `accountSchema` complet (currency `CHF`|`EUR`, accountType, overdraftLimit, deferredCard, billingDay, openingBalance, status, closedAt)
    - Dériver `createAccountSchema`, `updateAccountSchema`, `accountQuerySchema` en suivant le pattern de `charge.ts`
    - Exporter `Account`, `CreateAccountInput`, `UpdateAccountInput`, `AccountQuery`
    - _Requirements: 1.2, 1.6, 1.10_

  - [x] 1.3 Créer `packages/shared/src/schemas/transaction.ts` avec tous les schémas de transaction
    - `transactionSchema` : `amount` signé non-zéro (`.refine(v => v !== 0)`), `transferRole` enum `SOURCE`|`TARGET` nullable
    - Dériver `createTransactionSchema`, `updateTransactionSchema`, `transactionQuerySchema`
    - Exporter `Transaction`, `CreateTransactionInput`, `UpdateTransactionInput`, `TransactionQuery`
    - _Requirements: 1.3, 1.7, 1.10_

  - [x] 1.4 Créer `packages/shared/src/schemas/transfer.ts` avec schémas de transfert 2 phases
    - `transferSchema` complet ; `createTransferSchema` (phase 1 uniquement) avec `superRefine` validant `sourceAccountId !== targetAccountId`
    - `updateTransferSchema` (phase 2 : `amountReceived`, `receivedAt` uniquement)
    - Exporter tous les types inférés
    - _Requirements: 1.4, 1.8, 1.11_

  - [x] 1.5 Créer `packages/shared/src/schemas/snapshot.ts` avec `balanceSnapshotSchema`, `createSnapshotSchema`, `snapshotQuerySchema`
    - Exporter `BalanceSnapshot`, `CreateSnapshotInput`, `SnapshotQuery`
    - _Requirements: 1.5, 1.9, 1.10_

  - [x] 1.6 Créer `packages/shared/src/domain/balance.ts` avec les fonctions pures de solde
    - `computeBalance(account, transactions): number` — `openingBalance + Σ(amount)`
    - `computeSnapshotGap(snapshot, calculatedBalance): number` — `snapshot.balance − calculated`
    - `isOverdraft(account, balance): boolean` — `balance < −overdraftLimit`
    - Zéro import React/Next/Prisma
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.8_

  - [x] 1.7 Créer `packages/shared/src/domain/conversion.ts` avec les fonctions pures de conversion
    - `counterValue(amount, rate): number` — arrondi à 2 décimales
    - `effectiveRate(amountReceived, amountSent): number` — arrondi à 5 décimales
    - `transferFees(amountEstimated, amountReceived): number` — arrondi à 2 décimales
    - Zéro import React/Next/Prisma
    - _Requirements: 2.5, 2.6, 2.7, 2.8_

  - [x] 1.8 Créer les contrats HTTP dans `packages/shared/src/contracts/`
    - `members.http.ts` : `MemberHttp { findMany }`
    - `accounts.http.ts` : `AccountHttp { findMany, findOne, create, update, closeAccount, remove }`
    - `transactions.http.ts` : `TransactionHttp { findMany, findOne, create, update, remove }`
    - `transfers.http.ts` : `TransferHttp { findMany, findOne, create, completeTransfer }` avec type `TransferPhase2Update` séparé
    - `snapshots.http.ts` : `SnapshotHttp { findMany, findOne, create }`
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.9 Mettre à jour `packages/shared/src/index.ts` pour exporter tous les nouveaux schémas, types, fonctions de domaine et contrats
    - Conserver les exports existants (charge, payment, currency, filter, schedule)
    - _Requirements: 1.10, 3.3_

  - [ ]* 1.10 Écrire les tests unitaires pour les fonctions de domaine pur (UT-001 à UT-007)
    - `computeBalance` avec et sans transactions (UT-001, UT-002)
    - `computeSnapshotGap` (UT-003)
    - `effectiveRate` (UT-004), `transferFees` (UT-005), `counterValue` (UT-006)
    - Validation Zod devise USD rejetée (UT-007)
    - _Requirements: 10.1_

  - [ ]* 1.11 Écrire le test de propriété pour `computeBalance` (Property 1)
    - **Property 1 : computeBalance est une somme signée**
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 1.12 Écrire les tests de propriétés pour les fonctions de conversion (Properties 4–6)
    - **Property 4 : counterValue arrondit à 2 décimales**
    - **Property 5 : effectiveRate arrondit à 5 décimales**
    - **Property 6 : transferFees est l'écart arrondi à 2 décimales**
    - **Validates: Requirements 2.5, 2.6, 2.7**

  - [ ]* 1.13 Écrire les tests de propriétés pour les validations Zod (Properties 2, 3, 7, 8, 9)
    - **Property 2 : computeSnapshotGap est un écart algébrique**
    - **Property 3 : isOverdraft est une comparaison de borne**
    - **Property 7 : Validation devise — CHF et EUR uniquement**
    - **Property 8 : Transaction à montant zéro est invalide**
    - **Property 9 : createTransferSchema rejette les comptes identiques**
    - **Validates: Requirements 1.2, 1.3, 1.11, 2.3, 2.4**

- [ ] 2. Checkpoint — Shared package
  - Vérifier que `npm run typecheck` et `npm run test` passent dans `packages/shared`. S'assurer que les exports existants (charge, payment) restent inchangés.

- [ ] 3. Schéma Prisma + migration + seed
  - [x] 3.1 Mettre à jour `apps/web/prisma/schema.prisma` avec migration non-destructive d'`Account` et ajout des 4 nouveaux modèles
    - Renommer `balance` → `openingBalance`, `isActive` → `status`, ajouter tous les nouveaux champs d'`Account` (bank, accountType, memberId, overdraftLimit, deferredCard, billingDay, closedAt)
    - Ajouter les modèles `Member`, `Transaction`, `Transfer`, `BalanceSnapshot` selon le design
    - Ajouter les relations nommées Transfer (`TransferSourceAccount`, `TransferTargetAccount`)
    - Ajouter les index listés dans le design
    - Conserver la relation `charges` sur `Account` et tous les modèles `Charge`/`Payment` sans modification
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 3.2 Générer et appliquer la migration Prisma
    - Exécuter `prisma migrate dev --name add-m1-models`
    - Vérifier que la migration s'applique sans erreur et que les données `Charge`/`Payment` existantes sont préservées
    - Régénérer le client Prisma (`prisma generate`)
    - _Requirements: 4.4_

  - [x] 3.3 Créer `apps/web/prisma/seed.ts` avec les données de la maquette
    - 2 membres : `Anco` (PRIMARY), `Épouse` (PARTNER)
    - 3 comptes : UBS Courant (CHF, Anco), BNP Perso (EUR, Anco), BNP Joint (EUR, null)
    - Transactions représentatives : salaire +4400 CHF sur UBS, dépenses courantes
    - 1 Transfer ESTIMATED (Telexoo : 1500 CHF → EUR, taux estimé)
    - 1 BalanceSnapshot sur UBS Courant
    - _Requirements: 4.5_

- [ ] 4. Checkpoint — Prisma
  - Vérifier que `npm run db:generate` réussit et que `npx tsc --noEmit` passe dans `apps/web`. S'assurer que le service `ChargeService` compile toujours correctement.

- [ ] 5. Services backend + helpers filter-to-where
  - [ ] 5.1 Étendre `apps/web/src/server/common/filter-to-where.ts` avec les helpers pour les nouveaux modèles
    - Ajouter `accountQueryToWhere`, `transactionQueryToWhere`, `transferQueryToWhere`, `snapshotQueryToWhere`
    - Suivre le même pattern que `chargeQueryToWhere` existant
    - _Requirements: 5.2, 5.5, 5.7_

  - [ ] 5.2 Créer `apps/web/src/server/members/member.service.ts` avec `findMany`
    - Méthode `findMany(): Promise<Member[]>` — lecture seule M1
    - Singleton `globalThis`
    - _Requirements: 5.1_

  - [ ] 5.3 Créer `apps/web/src/server/accounts/account.service.ts` avec CRUD complet + méthodes `close` et `remove` protégée
    - `findMany`, `findOne`, `create`, `update` — CRUD standard suivant le pattern `ChargeService`
    - `close(id)` : `status=CLOSED`, `closedAt=new Date()`
    - `remove(id)` : vérifier transactions, snapshots, transferts, charges liés → 409 si données présentes
    - Mapper les dates ISO ↔ DateTime Prisma avec `parseISO` de `date-fns`
    - Singleton `globalThis`
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 5.4 Créer `apps/web/src/server/transactions/transaction.service.ts` avec CRUD + `remove` protégé
    - `findMany`, `findOne`, `create`, `update`, `remove`
    - `remove` : bloquer si `transferId !== null` → 409
    - Mapper `date` ISO ↔ DateTime
    - Singleton `globalThis`
    - _Requirements: 5.5, 5.6_

  - [ ] 5.5 Créer `apps/web/src/server/transfers/transfer.service.ts` avec opérations atomiques
    - `findMany`, `findOne`
    - `create(input)` : valider devises (CHF source, EUR cible), valider comptes distincts, `prisma.$transaction` → Transfer ESTIMATED + débit source (`amount = −amountSent`, `transferRole = "SOURCE"`)
    - `update(id, input)` (phase 2) : rejeter si `status === COMPLETED`, calculer `rateEffective`/`fees` via `effectiveRate`/`transferFees`/`counterValue` de `@mbongo/shared`, `prisma.$transaction` → Transfer COMPLETED + crédit cible (`amount = +amountReceived`, `transferRole = "TARGET"`)
    - Mapper toutes les dates ISO ↔ DateTime avec `parseISO`
    - Singleton `globalThis`
    - _Requirements: 5.7, 5.8, 5.9, 5.10, 5.11, 5.12_

  - [ ] 5.6 Créer `apps/web/src/server/snapshots/snapshot.service.ts`
    - `findMany`, `findOne`, `create` — pas de transaction d'ajustement automatique
    - Singleton `globalThis`
    - _Requirements: 5.13, 5.14_

  - [ ]* 5.7 Écrire les tests d'intégration pour `TransferService` (IT-001, IT-002)
    - IT-001 : `create` phase 1 — Transfer ESTIMATED + débit source créés, atomicité vérifiée
    - IT-002 : `update` phase 2 — statut COMPLETED, `rateEffective`/`fees` calculés, crédit cible créé
    - _Requirements: 10.2_

  - [ ]* 5.8 Écrire les tests d'intégration pour `AccountService.remove` (IT-004)
    - IT-004 : compte vide → 204, compte avec flux → 409
    - _Requirements: 10.3_

  - [ ]* 5.9 Écrire les tests de propriétés pour les services (Properties 10–14)
    - **Property 10 : AccountService.remove bloque tout compte avec données liées**
    - **Property 11 : TransactionService.remove bloque toute transaction liée à un transfert**
    - **Property 12 : TransferService.create exige CHF source et EUR cible**
    - **Property 13 : TransferService.update bloque tout transfert déjà COMPLETED**
    - **Property 14 : SnapshotService.create ne crée jamais de transaction d'ajustement**
    - **Validates: Requirements 5.3, 5.6, 5.9, 5.11, 5.13**

- [ ] 6. Checkpoint — Services
  - Vérifier que `npm run typecheck` et les tests d'intégration passent. Confirmer que `ChargeService` est toujours fonctionnel.

- [ ] 7. Controllers et routes API
  - [ ] 7.1 Créer `apps/web/src/server/members/members.controller.ts`
    - Méthode `find(request)` → 200 JSON membres
    - Singleton
    - _Requirements: 6.1_

  - [ ] 7.2 Créer `apps/web/src/server/accounts/accounts.controller.ts`
    - Méthodes `find`, `create`, `findOne`, `update`, `close`, `remove`
    - Suivre le pattern exact de `charges.controller.ts`
    - _Requirements: 6.2, 6.6, 6.7_

  - [ ] 7.3 Créer `apps/web/src/server/transactions/transactions.controller.ts`
    - Méthodes `find`, `create`, `findOne`, `update`, `remove`
    - _Requirements: 6.3, 6.6, 6.7_

  - [ ] 7.4 Créer `apps/web/src/server/transfers/transfers.controller.ts`
    - Méthodes `find`, `create`, `findOne`, `update` (phase 2)
    - `update` parse avec `updateTransferSchema`
    - _Requirements: 6.4, 6.6, 6.7_

  - [ ] 7.5 Créer `apps/web/src/server/snapshots/snapshots.controller.ts`
    - Méthodes `find`, `create`, `findOne`
    - _Requirements: 6.5, 6.6, 6.7_

  - [ ] 7.6 Créer toutes les routes API (wiring pur, ≤ 3 lignes de logique par export)
    - `app/api/members/route.ts` — GET
    - `app/api/accounts/route.ts` — GET, POST
    - `app/api/accounts/[id]/route.ts` — GET, PATCH, DELETE
    - `app/api/accounts/[id]/close/route.ts` — PATCH
    - `app/api/transactions/route.ts` — GET, POST
    - `app/api/transactions/[id]/route.ts` — GET, PATCH, DELETE
    - `app/api/transfers/route.ts` — GET, POST
    - `app/api/transfers/[id]/route.ts` — GET, PATCH
    - `app/api/snapshots/route.ts` — GET, POST
    - `app/api/snapshots/[id]/route.ts` — GET
    - _Requirements: 6.8, 6.9_

  - [ ]* 7.7 Écrire les smoke tests API (AT-001 à AT-004)
    - AT-001 : créer compte → saisir salaire → vérifier solde calculé
    - AT-002 : POST transfer phase 1 → PATCH phase 2 → vérifier comptes
    - AT-003 : POST snapshot → vérifier 201, aucune transaction d'ajustement
    - AT-004 : payload Zod invalide → 400 avec erreurs
    - _Requirements: 10.4, 10.5_

  - [ ]* 7.8 Écrire le test de propriété pour les erreurs de validation HTTP (Property 15)
    - **Property 15 : Tout payload invalide retourne HTTP 400**
    - **Validates: Requirements 6.6**

- [ ] 8. Checkpoint — API
  - Vérifier que `npm run typecheck`, `npm run lint` et tous les tests passent. Tester manuellement les routes via le seed.

- [ ] 9. Repositories frontend et hooks TanStack Query
  - [ ] 9.1 Créer `apps/web/src/repositories/members.repository.ts`
    - Implémenter `findMany` via `request('GET', '/members')`
    - Suivre le pattern de `charges.repository.ts`
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ] 9.2 Créer `apps/web/src/repositories/accounts.repository.ts`
    - `findMany`, `findOne`, `create`, `update`, `remove`
    - `closeAccount(id)` → PATCH `/api/accounts/:id/close`
    - Aucune logique métier ni calcul
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [ ] 9.3 Créer `apps/web/src/repositories/transactions.repository.ts`
    - `findMany`, `findOne`, `create`, `update`, `remove`
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ] 9.4 Créer `apps/web/src/repositories/transfers.repository.ts`
    - `findMany`, `findOne`, `create`, `remove`
    - `completeTransfer(id, input)` → PATCH `/api/transfers/:id` avec payload phase 2
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ] 9.5 Créer `apps/web/src/repositories/snapshots.repository.ts`
    - `findMany`, `findOne`, `create`
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ] 9.6 Créer `apps/web/src/hooks/use-accounts.ts` avec les hooks TanStack Query
    - `useAccounts(query?)`, `useCreateAccount()`, `useUpdateAccount()`, `useCloseAccount()`
    - Invalidation de `['accounts']` au succès des mutations
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 9.7 Créer `apps/web/src/hooks/use-transactions.ts`
    - `useTransactions(accountId?)`, `useCreateTransaction()`, `useUpdateTransaction()`, `useDeleteTransaction()`
    - Invalidation de `['transactions']` au succès
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 9.8 Créer `apps/web/src/hooks/use-transfers.ts`
    - `useTransfers()`, `useCreateTransfer()`, `useCompleteTransfer()`
    - Invalider `['transfers']` et `['accounts']` au succès (les soldes changent)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 9.9 Créer `apps/web/src/hooks/use-snapshots.ts` et `apps/web/src/hooks/use-members.ts`
    - `useSnapshots(accountId)`, `useCreateSnapshot()`
    - `useMembers()`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 10. Checkpoint — Repositories & hooks
  - Vérifier que `npm run typecheck` et `npm run lint` passent. S'assurer que les types des contrats HTTP sont respectés par les repositories.

- [ ] 11. UI mobile-first — page Comptes
  - [ ] 11.1 Créer `apps/web/src/components/accounts/accounts-guard.tsx`
    - Guard RSC async : prefetch via `accountService.findMany({})` + `HydrationBoundary`
    - Suivre exactement le pattern de `charges-guard.tsx`
    - _Requirements: 8.1, 8.4, 8.5_

  - [ ] 11.2 Créer `apps/web/src/components/accounts/accounts-view.tsx` (composant client)
    - Liste des comptes avec solde calculé : `computeBalance(account, transactions)` depuis `@mbongo/shared`
    - `useAccounts()` + `useTransactions(accountId)` pour les données
    - Badge `ACTIVE`/`CLOSED` (`StatusBadge`)
    - _Requirements: 8.1, 8.6_

  - [ ] 11.3 Créer `apps/web/src/app/(dashboard)/comptes/page.tsx` et `error.tsx`
    - Page RSC : `return <ComptesGuard />`
    - `error.tsx` pour la gestion d'erreur boundary
    - _Requirements: 8.1, 8.5_

- [ ] 12. UI mobile-first — page Transactions
  - [ ] 12.1 Créer `apps/web/src/components/transactions/transactions-guard.tsx`
    - Guard RSC : prefetch `transactionService.findMany({})`
    - _Requirements: 8.2, 8.4, 8.5_

  - [ ] 12.2 Créer `apps/web/src/components/transactions/transactions-view.tsx` (composant client)
    - Liste des transactions avec `useTransactions()`
    - Affichage date/montant/sens/catégorie/note
    - `DetailSheet` pour le détail avec modifier/supprimer
    - _Requirements: 8.2_

  - [ ] 12.3 Créer `apps/web/src/app/(dashboard)/transactions/page.tsx` et `error.tsx`
    - _Requirements: 8.2, 8.5_

- [ ] 13. UI mobile-first — page Transferts
  - [ ] 13.1 Créer `apps/web/src/components/transfers/transfers-guard.tsx`
    - Guard RSC : prefetch `transferService.findMany({})`
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ] 13.2 Créer `apps/web/src/components/transfers/transfers-view.tsx` (composant client)
    - Liste avec cartes phase 1 (badge ESTIMATED, contre-valeur `counterValue(amountSent, rateEstimated)`, "taux au JJ/MM/AAAA")
    - Cartes phase 2 (badge COMPLETED, taux effectif et frais depuis les champs persistés)
    - Bouton « Saisir le crédit » → formulaire phase 2 → `useCompleteTransfer()`
    - _Requirements: 8.3, 8.7, 8.8_

  - [ ] 13.3 Créer `apps/web/src/app/(dashboard)/transferts/page.tsx` et `error.tsx`
    - _Requirements: 8.3, 8.5_

- [ ] 14. Checkpoint final — Qualité
  - Vérifier que `npm run quality` (lint + format:check + typecheck) passe à zéro erreur dans `apps/web` et `packages/shared`.
  - Vérifier que tous les tests (`npm run test`) passent.
  - Mettre à jour `TODO.md` pour marquer les jalons M1 comme complétés.

---

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être différées pour un MVP rapide
- Les tests de propriétés (Properties 1–15) utilisent Jest avec des valeurs générées aléatoirement — les generators produisent des nombres positifs, négatifs, grands et petits
- La migration Prisma doit être non-destructive : `balance` → `openingBalance`, `isActive` → `status` ; les données `Charge`/`Payment` existantes sont préservées
- Les calculs (`computeBalance`, `counterValue`, etc.) ne sont **jamais** dans les services — uniquement dans les fonctions pures `@mbongo/shared` et dans l'UI
- Les `route.ts` sont du wiring pur : aucune logique, 3 exports max
- `date-fns` (`parseISO`, `format`) est utilisé pour toutes les manipulations de dates dans les services et l'UI
- Chaque service suit le singleton `globalThis` pattern de `charge.service.ts`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5"] },
    { "id": 1, "tasks": ["1.6", "1.7", "1.8"] },
    { "id": 2, "tasks": ["1.9", "1.10", "1.11", "1.12", "1.13"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3", "5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 7, "tasks": ["5.7", "5.8", "5.9"] },
    { "id": 8, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 9, "tasks": ["7.6"] },
    { "id": 10, "tasks": ["7.7", "7.8"] },
    { "id": 11, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 12, "tasks": ["9.6", "9.7", "9.8", "9.9"] },
    { "id": 13, "tasks": ["11.1", "12.1", "13.1"] },
    { "id": 14, "tasks": ["11.2", "12.2", "13.2"] },
    { "id": 15, "tasks": ["11.3", "12.3", "13.3"] }
  ]
}
```
