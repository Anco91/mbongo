---
id: 43-dashboard-start-balance
status: ready
branch: spec/43-dashboard-start-balance
tier: medium
locked_at: fbf2b285f98a02394ae5e9cdeda171296a046c5a
locked_tests:
  - apps/web/__tests__/scenarios/budget-journey.start-balance.test.ts
---

# 43 — Le solde de départ enregistré ancre la projection du dashboard

Master: `specs/SPEC_MASTER.md` · Needs: 38, 40 · Rules: WF-3, WF-7, TEST-1..5, FE-1..9

## Summary

- Pourquoi : l'étape « Comptes » enregistre un solde de départ par mois (spec 40) mais le dashboard l'ignore ; il part toujours du solde réel du jour.
- Ce qui change : pour un mois courant ou futur, un compte qui a un solde de départ enregistré est projeté en fin de mois = départ + flux du mois (revenus − charges, transactions, virements). Sans solde enregistré, ou pour un mois passé, rien ne change.
- Changement de comportement visible : oui, patrimoine / soldes projetés du dashboard. Mise à jour de `specs/current/monthly-budget/spec.md` à la revue (SPEC-3).

## Decisions (PM)

- Formule inchangée (solde + revenus − charges) ; seul l'ancrage change, par compte : chaque compte avec un départ enregistré est ancré, les autres restent sur le réel du jour.
- Fenêtre des flux d'un compte ancré = du 1er au dernier jour du mois cible. Les flux des mois précédents (échéances en retard, revenu confirmé en avance) sont déjà dans le départ saisi : exclus.
- Mois passé : le départ enregistré est ignoré (solde réel en fin de mois). Compte inconnu ou clos : ignoré.
- Le solde de départ suggéré pour le mois suivant tient compte du départ enregistré du mois précédent (même fonction, même entrée).

## Acceptance criteria

1. `apps/web/__tests__/scenarios/budget-journey.start-balance.test.ts` passe (verrouillé) ; les tests de projection existants (spec 38) restent verts.
2. `computeProjectedBalance` accepte `startOverrides?: Record<string, number>` ; sans lui, le résultat est identique à aujourd'hui.
3. Le dashboard passe les départs enregistrés du mois du curseur ; le patrimoine projeté les utilise.
4. `useMonthStart` utilise les départs enregistrés du mois précédent pour la fin du mois précédent.
5. Full suite, typecheck, lint, build, `arch-check.sh` verts. `GET /` et `/budget/2026-12` répondent 200 (dev server, aucune écriture).

## Frame

### Create

| Path | Role | Exports (signatures) |
|---|---|---|
| (aucun) | | |

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/lib/calculation/projected-balance.ts` | `ProjectionInput.startOverrides?: Record<string, number>`. Dans `computeProjectedBalance`, pour un mois `current`/`future` : les comptes ACTIVE présents dans `startOverrides` ont `balance = override + flux du mois` (fenêtre `monthKey-01` → `monthKey-31` : transactions datées dans le mois, revenus dus non confirmés du mois seul, paiements PENDING dont l'échéance est dans le mois, jambe cible manquante d'un virement ESTIMATED daté dans le mois, facturation de carte dans le mois). Les autres comptes gardent le chemin actuel. Ajouter une borne basse (`from`) aux fonctions de flux plutôt que de dupliquer. Arrondi `roundCents` conservé. |
| `apps/web/src/components/dashboard/use-dashboard-data.ts` | `useSuspenseQuery(monthStartBalanceQueries.byMonth(selectedMonth))` → `startOverrides` (`Object.fromEntries` des lignes, `useMemo`) passé à `computeProjectedBalance` et ajouté aux dépendances. |
| `apps/web/src/components/dashboard/dashboard-guard.tsx` | Entrée de préchargement `monthStartBalanceService.findByMonth(currentMonthKey())` avec la clé de `monthStartBalanceQueries.byMonth`. |
| `apps/web/src/components/budget/use-month-start.ts` | Lire `useMonthStartBalances(previous)` et le passer en `startOverrides` à `computeProjectedBalance` ; compter dans `isLoading`. |
| `ARCHITECTURE.md` | Une ligne : la projection accepte `startOverrides`. |
| `specs/current/monthly-budget/spec.md` | Advisor à la revue (SPEC-2/3). L'Executor n'y touche pas. |
| `specs/SPEC_MASTER.md` | Advisor : ligne 43. |

### Read (allow-list)

`ARCHITECTURE.md`, `packages/shared/src/lib/calculation/projected-balance.ts`, `packages/shared/src/domain/{balance,income}.ts`, `apps/web/src/components/dashboard/{use-dashboard-data,dashboard-guard}.ts*`, `apps/web/src/components/budget/use-month-start.ts`, `apps/web/src/queries/month-start-balances.ts`, `apps/web/src/server/month-start-balances/month-start-balance.service.ts`, `apps/web/__tests__/scenarios/budget-journey.start-balance.test.ts`, `apps/web/__tests__/stubs/budget-journey-fixture.ts`.

### Reuse / Libraries / Forbidden

- Reuse : `monthStartBalanceQueries`, `monthStartBalanceService`, `computeMonthExpectedIncome`, `balanceAsOf`.
- Libraries : aucune nouvelle.
- Forbidden : le test verrouillé, `useEffect`, toute écriture en base, tout fichier non listé, toute modification de la signature de retour de `computeProjectedBalance`.
- Size : 1 fichier de calcul + 3 de câblage ; tier medium.

## Tests

Locked (TEST-1, fonction pure) : `apps/web/__tests__/scenarios/budget-journey.start-balance.test.ts` (12 tests, 8 rouges avant code).

Proof of failure : `cd apps/web && npx jest __tests__/scenarios/budget-journey.start-balance.test.ts` → 8 failed, 4 passed (champ `startOverrides` ignoré).

Pas de test d'UI (TEST-2).

### Proposed by the Executor

| Path | What it covers | Status |
|---|---|---|

### Test change requests

| Test | Reason | Proposal | Decision |
|---|---|---|---|

## Out of scope

- Suppression d'un solde enregistré.
- Utiliser les départs enregistrés pour le patrimoine « du jour » (état réel).

## Handoffs

