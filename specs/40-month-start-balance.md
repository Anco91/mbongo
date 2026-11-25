---
id: 40-month-start-balance
status: ready
branch: spec/40-month-start-balance
tier: medium
locked_at: 48481340ef6dc38c6f0d8bdec4a3d97ed64ad782
locked_tests:
  - apps/web/__tests__/month-start-balance-schema.test.ts
---

# 40 — Solde logique de départ par mois (persisté)

Master: `specs/SPEC_MASTER.md` · Needs: 39 · Rules: WF-3, WF-7, TEST-1..5, BE-1..4, FE-1..9

## Summary

- Pourquoi : l'étape « Comptes » de la préparation modifie `openingBalance` (le solde d'ouverture du compte, à vie) ; on ne peut pas fixer le solde de départ d'un mois sans réécrire l'historique de tous les mois.
- Ce qui change : chaque compte actif affiche, pour le mois préparé, son solde logique de départ (suggestion `suggestMonthStart` = fin du mois précédent, découvert de carte différée non reporté), modifiable et enregistré pour ce mois et ce compte seulement.
- Changement de comportement visible : oui, l'étape « Comptes » ; `openingBalance` n'est plus touché par la préparation. Mise à jour de `specs/current/monthly-budget/spec.md` à la revue (SPEC-3).

## Decisions (PM, human decisions of 2026-11-25 kept)

- Table dédiée `MonthStartBalance`, pas un `BalanceSnapshot` (il remettrait `computeStatementGap` à zéro). Migration additive seulement : **porte humaine GIT-7 levée par l'humain** (« fini tout »).
- Une ligne par (mois, compte), `@@unique([month, accountId])` ; écriture = upsert idempotent, un seul `PUT /api/month-start-balances/{month}` pour une liste de comptes.
- Valeur par défaut affichée = `startOverrides[id] ?? suggestMonthStart(...)` ; on n'enregistre que ce que l'utilisateur confirme (aucune écriture à l'ouverture de l'étape ni à la lecture).
- Solde de fin du mois précédent = `computeProjectedBalance({ monthKey: précédent, … }).balances` (réel si passé, projeté sinon), même câblage que le tableau de bord. Pas de nouvelle règle métier : `computeMonthPlan` et `suggestMonthStart` (spec 39) restent inchangés.
- `balance` : nombre fini à 2 décimales au plus (bruit flottant sous le centime accepté), négatif permis (découvert). `Float` en base comme le reste du projet.
- `GET` d'un mois sans ligne renvoie `[]` (pas 404), comme `monthly-budgets` renvoie `null`.

## Acceptance criteria

1. `apps/web/__tests__/month-start-balance-schema.test.ts` passe (verrouillé).
2. `PUT /api/month-start-balances/2026-12` avec `{ balances: [{ accountId, balance }] }` crée ou met à jour la ligne (mois, compte) ; deux appels identiques laissent une seule ligne ; `GET` renvoie les lignes du mois, `[]` sinon. Compte inconnu → 404 (`NotFoundError`), mois invalide ou corps invalide → 400/422 via `toErrorResponse`.
3. L'étape « Comptes » de `/budget/<mois>` montre pour chaque compte ACTIVE le solde de départ du mois (enregistré, sinon suggestion), « Ajuster » l'enregistre pour ce mois seulement ; `openingBalance` n'est plus modifié par cette étape. « Fermer » et « Nouveau compte » restent.
4. Full suite, typecheck, lint, build verts ; `arch-check.sh` vert ; `ARCHITECTURE.md` à jour (module map, registre, queries).
5. Après migration : `GET /budget/2026-12` répond 200 (dev server, aucune écriture).

## Frame

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| `packages/shared/src/schemas/month-start-balance.ts` | Zod schemas | `monthStartBalanceSchema` = `{ month: monthKeySchema, accountId: string.min(1), balance: finite number, createdAt: isoDate, updatedAt: isoDate }` ; `saveMonthStartBalancesSchema` = `{ balances: array(≥1) of { accountId: string.min(1), balance: finite, ≤ 2 decimals (`Math.abs(x*100 - Math.round(x*100)) < 1e-6`) } }` + refine « un accountId une fois » ; types `MonthStartBalance`, `SaveMonthStartBalancesInput` |
| `packages/shared/src/contracts/month-start-balances.http.ts` | HTTP contract | `interface MonthStartBalanceHttp { findByMonth(month: string): Promise<MonthStartBalance[]>; save(month: string, input: SaveMonthStartBalancesInput): Promise<MonthStartBalance[]> }` |
| `apps/web/src/server/month-start-balances/month-start-balance.service.ts` | Prisma service | class `MonthStartBalanceService` + singleton `monthStartBalanceService` ; `findByMonth(month)` ; `save(month, input)` : vérifie que tous les comptes existent (sinon `NotFoundError`), upsert par `month_accountId` dans une `prisma.$transaction`, renvoie les lignes du mois |
| `apps/web/src/server/month-start-balances/month-start-balances.controller.ts` | Controller | class `MonthStartBalancesController` + singleton `monthStartBalancesController` ; `findByMonth(month)`, `save(month, request)` : `monthKeySchema.parse`, `parseBody(request, saveMonthStartBalancesSchema)` (le corps invalide ne doit PAS être avalé), `toSuccessResponse` / `toErrorResponse` |
| `apps/web/src/app/api/month-start-balances/[month]/route.ts` | Route | `GET`, `PUT` : câblage pur sur le controller |
| `apps/web/src/repositories/month-start-balances.repository.ts` | Client | `monthStartBalancesRepository: MonthStartBalanceHttp`, valide la réponse avec les schémas partagés |
| `apps/web/src/queries/month-start-balances.ts` | Query factory | `monthStartBalanceQueries.all()`, `.byMonth(month)` → `queryOptions` |
| `apps/web/src/hooks/use-month-start-balances.ts` | Hooks | `useMonthStartBalances(month)`, `useSaveMonthStartBalances()` (invalide `monthStartBalanceQueries.byMonth(month)`) |
| `apps/web/src/components/budget/use-month-start.ts` | Hook de vue | `useMonthStart(month: string): { isLoading: boolean; suggested: AccountBalances; saved: AccountBalances }` : câble `suggestMonthStart(accounts, previousEnd)` avec `previousEnd = computeProjectedBalance({... monthKey: shiftMonthKey(month, -1)}).balances` comme `use-dashboard-data.ts` (mêmes hooks de données) et `saved` = lignes du mois par compte |
| `apps/web/prisma/migrations/<horodatage>_month_start_balances/migration.sql` | Migration | générée par `prisma migrate dev --name month_start_balances` |

### Modify

| Path | Change |
|---|---|
| `apps/web/prisma/schema.prisma` | Ajouter `model MonthStartBalance { id String @id @default(uuid()); month String; accountId String; account Account @relation(fields: [accountId], references: [id], onDelete: Cascade); balance Float; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt; @@unique([month, accountId]); @@map("month_start_balances") }` et `monthStartBalances MonthStartBalance[]` sur `Account`. Additif seulement. |
| `packages/shared/src/index.ts` | Deux lignes `export *` (schéma, contrat). |
| `apps/web/src/components/budget/steps/accounts-step.tsx` | Prend `month: string` ; chaque ligne affiche `saved[id] ?? suggested[id]`, `onConfirm(amount)` → `useSaveMonthStartBalances().mutateAsync({ month, input: { balances: [{ accountId, balance: amount }] } })` ; plus d'appel `useUpdateAccount` avec `openingBalance`. Garder « Fermer » et `CreatePanel`. Libellé de ligne : « Solde de départ ». |
| `apps/web/src/components/budget/budget-view.tsx` | `<AccountsStep month={month} />`. |
| `ARCHITECTURE.md` | Module map (`month-start-balances`), `monthStartBalanceQueries` dans les queries, registre : schéma, `useMonthStart`. |
| `specs/current/monthly-budget/spec.md` | **Advisor à la revue** (SPEC-2/3). L'Executor n'y touche pas. |
| `specs/SPEC_MASTER.md` | Advisor : ligne 40 `ready` → `done` à la fin. |

### Read (allow-list)

`ARCHITECTURE.md`, `packages/shared/src/schemas/{monthly-budget,charge}.ts`, `packages/shared/src/contracts/monthly-budgets.http.ts`, `packages/shared/src/lib/calculation/{month-journey,projected-balance}.ts`, `apps/web/src/{server/monthly-budgets/*,app/api/monthly-budgets/[month]/route.ts,repositories/monthly-budgets.repository.ts,queries/monthly-budgets.ts,hooks/use-monthly-budget.ts}`, `apps/web/src/components/dashboard/use-dashboard-data.ts` (câblage de `computeProjectedBalance`), `apps/web/src/components/budget/**`, `apps/web/src/lib/month-navigation.ts` (`shiftMonthKey`), `apps/web/src/server/common/http.ts`, `apps/web/prisma/schema.prisma`.

### Reuse / Libraries / Forbidden

- Reuse: `monthKeySchema`, `isoDate`, `suggestMonthStart`, `AccountBalances`, `computeProjectedBalance`, `shiftMonthKey`, `EditableItem`, `parseBody`, `NotFoundError`, `toSuccessResponse`, `toErrorResponse`. Style exemplars : les fichiers `monthly-budgets` listés ci-dessus (copier le modèle).
- Libraries : zod, Prisma, TanStack Query (`queryOptions`, `useMutation`), date-fns. Aucune nouvelle dépendance.
- Forbidden : le test verrouillé, toute colonne ou table existante modifiée ou supprimée (migration additive), toute écriture dans `dev.db` hors `prisma migrate dev` (pas de script de seed ni de PUT manuel), `useEffect`, `BalanceSnapshot`, `openingBalance` modifié depuis la préparation, tout fichier non listé.
- **Avant `prisma migrate dev`** : copier la base de dev dans le scratchpad de la session (`cp` du fichier `.db` désigné par la config Prisma ; ne pas lire les fichiers `.env`). Si la migration échoue ou réclame un reset : stop, ne pas accepter le reset.
- Size : ~10 fichiers de production (copie de modèle) ; tier medium.

## Tests

Locked (Advisor, TEST-1 : schémas purs) : `apps/web/__tests__/month-start-balance-schema.test.ts` — ligne valide, mois invalide, solde non fini, corps de sauvegarde (liste vide, doublon de compte, > 2 décimales, bruit flottant accepté, négatif accepté).

Proof of failure (voir « Handoffs » pour le commit) : `cd apps/web && npx jest __tests__/month-start-balance-schema.test.ts` → 23 failed (`monthStartBalanceSchema` / `saveMonthStartBalancesSchema` absents de `@mbongo/shared`).

Pas de test d'UI (TEST-2). Service, contrôleur et étape : vérification manuelle ; l'Executor peut proposer un test de service avec Prisma mocké (modèle `monthly-budget.service.test.ts`) dans un **nouveau** fichier, marqué `pending-review`.

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Kickoff

- Équipe : Advisor (cette spec + tests), Executor `agents-fw-executor` (tier medium), Reviewer `agents-fw-reviewer`.
- Ordre : schéma + contrat → Prisma + migration (après sauvegarde) → service, controller, route → repository, queries, hooks → `useMonthStart` + étape → `ARCHITECTURE.md`.
- Blocages vont à l'Advisor/PM ; aucune question à l'humain.

## Out of scope

- Utiliser les soldes de départ enregistrés dans le calcul du patrimoine ou de la projection (le tableau de bord les ignore ; ligne ultérieure).
- Suppression d'un solde enregistré (revenir à la suggestion) : pas d'endpoint `DELETE`.
- Rejouer le calcul de la suggestion côté serveur (la valeur enregistrée est celle que l'utilisateur confirme).
- Lignes 36, 37 (import CSV, transferts externes) : parquées.

## Handoffs

- `docs/handoffs/20261125-1955-39-month-journey.md`
