# Proposal

## Why

`npm run dev` ne permet pas de tester l'app : toute création de charge échoue en erreur 500 (violation de clé étrangère P2003) parce que le front envoie un `accountId` placeholder inexistant en base. Derrière ce bug, le constat structurel est que le backend est complet (services + controllers + zod) mais que seules les routes `/api/charges` et `/api/payments` sont câblées, et qu'il n'existe aucune UI exploitable. Le POC M1 du cahier des charges (flux salaire → Telexoo → BoursoBank → joint, soldes justes) n'est pas saisissable de bout en bout.

## What Changes

- **Fix FK P2003** : la création de charge n'envoie plus d'`accountId` hardcodé ; l'utilisateur choisit un compte réel dans un formulaire dédié (page de création, pas un bouton placeholder).
- **Mapping d'erreurs Prisma** : une violation de clé étrangère (P2003) est traduite en erreur 422 lisible ("compte inconnu") au lieu d'un 500 brut.
- **Wiring API manquant** : ajouter les route handlers minces (wiring pur, R1) pour `/api/accounts`, `/api/members`, `/api/transfers`, `/api/snapshots` — les controllers et services existent déjà.
- **UI Comptes** : liste des comptes (soldes, devise, type) + page de création de compte (F1).
- **UI Transferts** : liste des transferts + création en phase 1 "estimé" (montant CHF → contre-valeur EUR au taux de référence daté), complétion phase 2 "réalisé" (montant crédité → taux effectif + frais recalculés) (F5).
- **UI Charges** : formulaire de création conforme aux 5 types de charges (sections conditionnelles par type, cf. mock_POC), liste lisible.

Le change couvre le POC M1 complet : le flux salaire → transfert → charge est saisissable de bout en bout avec des soldes justes.

## Capabilities

### New Capabilities

- `household-members`: gestion des membres du foyer (lecture/création) — prérequis pour rattacher les comptes à une personne (F8, socle minimal).
- `account-management`: gestion des comptes (CRUD, statut actif/clos, découvert, carte à débit différé) exposée via API et UI de liste/création (F1).
- `charge-management`: gestion des charges typées avec sélection d'un compte réel à la création, génération des échéances, et gestion d'erreur utilisateur lisible (F3 + fix P2003).
- `transfer-management`: transfert inter-comptes en 2 phases (estimé → réalisé) avec taux datés et frais traçables, exposé via API et UI (F5).

### Modified Capabilities

<!-- Aucune spec existante (openspec/specs est vide) — première base de specs du projet. -->

## Impact

- **Code touché** :
  - `apps/web/src/app/api/` : nouveaux route.ts (accounts, members, transfers, snapshots) — wiring pur de 3 lignes chacun.
  - `apps/web/src/components/` : nouvelles guards/views/hooks pour comptes, transferts, membres ; réécriture du formulaire de charge (remplace `CreateChargeButton` placeholder dans `charges-view.tsx`).
  - `apps/web/src/server/common/` : mapping d'erreurs Prisma (P2003 → 422) dans le handler commun.
  - `packages/shared` : aucun changement de schéma nécessaire (les schémas existent déjà) sauf découverte à l'implémentation.
- **APIs** : nouvelles routes GET/POST (conformes aux contrats zod existants dans `packages/shared/src/contracts/`).
- **Dépendances** : aucune nouvelle dépendance (Recharts/TanStack Query déjà en place ; shadcn/ui à vérifier à l'implémentation).
- **Hors périmètre** : import CSV (F9), provisions/échéancier visuel avancé (F4 UI fine), dashboard Sankey (F6) — jalons M2/M3.
