---
id: 48-future-month-budget-only
status: ready
branch: spec/48-future-month-budget-only
tier: medium
locked_at: PENDING
locked_tests:
  - apps/web/__tests__/scenarios/budget-coherence.test.ts
---

# 48 — Un mois futur montre le budget du mois, jamais un solde reporté

Master: `specs/SPEC_MASTER.md` · Needs: 35, 38, 43 · Rules: WF-3, TEST-1..5, FE-1..9

## Summary

- Pourquoi : la carte patrimoine affichait 6 328,65 € en décembre puis 10 107,80 € en janvier : le solde du jour plus les flux de tous les mois, soit +4 200 € par mois (13 890, 18 090, 22 290 sur le jeu de test). Les lignes de comptes ne bougeaient pas : total et lignes ne parlaient pas du même instant.
- Ce qui change : un mois futur affiche uniquement « Revenus prévus », « Charges prévues » et « Reste à vivre » du mois, sans solde, sans lignes de comptes, sans report. Passé et courant : solde réel / projeté, lignes et total issus des mêmes soldes.
- Changement de comportement visible : oui. Renverse D3/D4 du plan 36-38 et `specs/current/dashboard/spec.md` (projection d'un mois futur). Mise à jour à la revue (SPEC-3).

## Decisions (PM)

- Trois objets séparés (comptes, budget du mois, prévision de trésorerie) ; la prévision n'est pas construite ici.
- `computeProjectedBalance` n'est pas modifiée (passé et courant l'utilisent toujours, ses tests de la spec 38/43 restent verts) : la carte cesse seulement de s'en servir pour un mois futur.
- Un mois futur préparé (départ enregistré) montre aussi seulement le budget par défaut ; un solde projeté pour ce mois est une demande ultérieure.
- Une seule fonction pure, `computeWealthView`, produit tous les chiffres de la carte ; hook et carte ne font que l'afficher.

## Acceptance criteria

1. `apps/web/__tests__/scenarios/budget-coherence.test.ts` passe (verrouillé, 14 tests) ; les tests des specs 38/43 restent verts.
2. Un mois futur : `kind: 'budget'`, aucune ligne, `totalEur` null, reste = revenus − charges du mois ; janvier ne dépend ni de décembre ni des soldes des comptes.
3. Passé et courant : `kind: 'balances'`, total = somme des lignes (0,01 près).
4. Le dashboard affiche la ventilation du budget pour un mois futur et ses lignes issues de `computeWealthView` pour les autres.
5. Suite complète, typecheck, lint, `arch-check.sh` verts.

## Frame

### Create

`packages/shared/src/lib/calculation/wealth-view.ts` existe (stub verrouillé exporté par le barrel) : remplacer le corps de `computeWealthView`.

### Modify

| Path | Change |
|---|---|
| `packages/shared/src/lib/calculation/wealth-view.ts` | `computeMonthState`; `computeMonthPlan` (budget, `previousEndBalances: null`); futur → `{kind:'budget', terms:[], totalEur:null}` ; sinon `computeProjectedBalance` puis `listNetWorthTerms(accounts, projection.balances)` et `totalEur` de la projection. |
| `apps/web/src/components/dashboard/use-dashboard-data.ts` | Appeler `computeWealthView` ; exposer `wealthView` ; retirer `netWorthTerms` issu de `balanceAsOf(now)` pour la carte. |
| `apps/web/src/components/dashboard/cards/wealth-card.tsx` | Rendre `WealthView` : futur = trois lignes budget (Revenus prévus, Charges prévues, Reste à vivre), sinon total + lignes. |
| `ARCHITECTURE.md` | Registre : `wealth-view.ts`. |
| `specs/current/dashboard/spec.md`, `specs/current/monthly-budget/spec.md`, `specs/SPEC_MASTER.md` | Advisor (SPEC-3, ligne 48). |

### Forbidden

Toucher au test verrouillé ; modifier `computeProjectedBalance` ; nouveau calcul dans le hook ou la carte ; `useEffect` ; `npm run build` (dev server).

## Proof of failure

`npx jest __tests__/scenarios/budget-coherence.test.ts` : 14 rouges (`not implemented`). Ancien calcul sur le jeu de test (`computeProjectedBalance`) : totaux décembre 13 890, janvier 18 090, février 22 290, mars 26 490 (+4 200 par mois).

## Handoffs

(aucun)
