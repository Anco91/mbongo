# Design

## Context

Voir `proposal.md` — Why. État technique qui façonne l'approche :

- Backend complet et conforme au cadre R1–R10 : services en classes singleton, controllers NestJS-like, schémas zod dans `packages/shared`, contracts HTTP typés.
- Seules les routes `/api/charges`, `/api/charges/[id]`, `/api/payments`, `/api/payments/[id]` et `/api/transactions` sont câblées. Accounts, members, transfers, snapshots ont service + controller mais aucun `route.ts`.
- La génération des échéances vit côté client (`use-charges.ts` : `generatePayments` depuis `packages/shared/domain/schedule`, puis `createMany` via `/api/payments`) avec reprise de récupération — ce mécanisme est conservé tel quel.
- `packages/shared/domain/balance.ts` fournit `computeBalance` (openingBalance + somme des transactions signées) — le calcul de solde de la liste de comptes se fait là.
- Dépendances présentes : TanStack Query, Tailwind, date-fns, zod. Absentes : react-hook-form, shadcn/ui, recharts (n'entrent pas tous dans ce change).

## Goals / Non-Goals

**Goals:**

- Toute création (charge, compte, transfert, snapshot) référence des entités existantes ; une référence inconnue donne une 4xx lisible, jamais un 500 Prisma brut.
- Le flux M1 est saisissable de bout en bout : membre → compte → charge (échéances générées) → transfert phase 1 → phase 2 → soldes justes.
- UI server-first conforme R8 : guards RSC + Suspense + error.tsx, hooks de domaine TanStack Query, mutations vers `/api` + invalidation.

**Non-Goals:**

- Pas d'habillage PWA complet (phone-frame, bottom nav, Sankey, donut) — M3.
- Pas d'import CSV, provisions, alertes — M2/M3.
- Pas de pages d'édition de compte/transfert (lecture + création seulement ; mutations cohabitent plus tard, cf. mock_POC).
- Pas de création/modification de membres (lecture seule, seed suffit en M1).

## Decisions

### D1 — Erreurs FK lisibles : validation amont + fallback centralisé

Deux couches :

1. **Amont (services)** : pré-valider les références avant toute écriture, comme le fait déjà `transfer.service.ts` (`NotFoundError` / `HttpError 422`). `charge.service.create` et `snapshot.service.create` vérifient l'existence du compte ciblé et lèvent un `HttpError(422, "compte inconnu")` ; `account.service.create` vérifie le membre si `memberId` est fourni.
2. **Aval (fallback)** : `toErrorResponse` dans `server/common/http.ts` détecte `PrismaClientKnownRequestError` avec `code: 'P2003'` et le traduit en `HttpError(422)` générique. Filet de sécurité si une écriture échappe à la validation amont.

*Alternative écartée* : uniquement le fallback central — le message serait générique ("référence inconnue") au lieu du message métier précis ("compte inconnu : {id}"). *Alternative écartée* : uniquement l'amont — tout nouveau service oublierait la validation et réintroduirait des 500.

### D2 — Solde affiché calculé côté client (R9)

La liste de comptes charge `useAccounts()` + `useTransactions()` (l'API transactions existe déjà) et calcule chaque solde avec `computeBalance` de `packages/shared` — la donnée est déjà chez le client, aucune route "getBalances" n'est créée. Le compte clos est filtré de la vue courante côté UI.

*Alternative écartée* : enrichir `accountService.findMany` d'un champ `balance` calculé serveur — mélange calcul métier dans le service pour un affichage front, contraire à R9, et multiplie les requêtes SQL.

### D3 — Formulaires : react-hook-form + zodResolver

Ajout de `react-hook-form` + `@hookform/resolvers` (zod). Les schémas zod de `packages/shared` (`createChargeSchema`, `createAccountSchema`, `createTransferSchema`, `createSnapshotSchema`) deviennent la validation unique du formulaire et de l'API (R7 : une source de vérité). Le formulaire de charge adapte ses champs au type choisi (sections conditionnelles du mock_POC).

*Alternative écartée* : inputs contrôlés à la main — moins de dépendances mais re-validation manuelle dupliquée pour 4 formulaires et perte du lien direct avec les schémas partagés.

### D4 — Structure UI : un dossier par domaine, pages dédiées à la création

Reprennent les patterns existants de `charges/` (guard RSC → view client + hooks) :

```
src/components/
├── accounts/    accounts-guard.tsx, accounts-view.tsx, account-create-form.tsx, hooks/use-accounts.ts
├── members/     hooks/use-members.ts (lecture seule, pas de view dédiée)
├── transfers/   transfers-guard.tsx, transfers-view.tsx, transfer-create-form.tsx, hooks/use-transfers.ts
└── charges/     (existant) + charge-create-form.tsx, hooks/use-transactions.ts transverse
src/app/(dashboard)/
├── comptes/page.tsx            # guard + view
├── comptes/nouveau/page.tsx    # page dédiée création
├── transferts/page.tsx         # liste + phase 2 sur le même écran (mutation ponctuelle)
└── charges/nouveau/page.tsx    # page dédiée création
```

Phase 2 du transfert : une action "Enregistrer le crédit" sur la carte du transfert estimé (formulaire local dans le `DetailSheet`-like) plutôt qu'une page dédiée — action unique, rare, pas un parcours à part.

*Alternative écartée* : modal de création sur la liste — le mock_POC tranche explicitement "one page, one responsibility".

### D5 — Wiring API : trois lignes par route, conformes aux contracts

`/api/accounts`, `/api/accounts/[id]`, `/api/members`, `/api/transfers`, `/api/transfers/[id]`, `/api/snapshots` : chaque `route.ts` exporte les méthodes du controller existant (R1). Les méthodes `close`/`remove` de compte suivent le pattern `route.ts` existant de `charges/[id]`. Les contrats HTTP de `packages/shared/src/contracts/` sont déjà écrits — les repositories front s'appuient dessus.

### D6 — Repositories front typés

Un module `src/lib/repositories/` (ou extension du pattern `paymentsRepository` existant dans `use-charges.ts`) : `accountsRepository`, `membersRepository`, `transfersRepository`, `snapshotsRepository` — fetch + parsing zod via les contracts partagés. Centralisés dans un fichier par domaine plutôt qu'inline dans les hooks (le pattern actuel inline ne scale pas à 4 domaines).

## Risks / Trade-offs

- [Le front envoie des données validées par un schéma différent de celui de l'API] → les mêmes schémas zod sont importés des deux côtés (R7) ; tests de contrat sur les repositories.
- [Filtrer les comptes clos côté UI seulement] → acceptable en M1 ; le filtre serveur `status` existe déjà dans `accountQueryToWhere`, l'UI passe `status: ACTIVE` en query quand elle en fait la demande.
- [Payment generation client-side échoue silencieusement si /api/payments tombe] → mécanisme de reprise existant (`missingPayments` + notice) conservé ; testé.
- [Aucune dépendance UI (shadcn) : formulaires nus en Tailwind] → assumé en M1 (parcimonie, le mock lui-même note que la production utilisera shadcn) ; l'habillage arrive avec le dashboard M3.
- [Phase 2 transfert sur la liste : UX dense sur mobile] → la carte estimée porte le seul champ nécessaire (montant crédité + date) ; pas de navigation.

## Migration Plan

- Aucune migration de schéma Prisma nécessaire (aucun modèle ne change).
- Ordre de déploiement : D1 (erreurs lisibles) indépendant et d'abord ; wiring API (D5) ensuite ; UI (D3, D4, D6) ensuite. Chaque étape est réversible indépendamment (commits séparés).
- Rollback : git revert par étape ; la base reste compatible.

## Open Questions

Aucune — les questions restantes du cdc (formats CSV, nom définitif) concernent M3 et n'affectent pas ce change.
