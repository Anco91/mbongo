## Decisions

- **Fonction pure séparée** `listNetWorthTerms(accounts, balances)`, pas de nouveau champ dans `ConsolidatedBalance`: aucun test ni appelant existant ne bouge. Même règle de solde que `computeConsolidatedBalance` (`balances[id] ?? openingBalance ?? 0`, comptes ACTIVE, arrondi 2 décimales).
- **Termes en devise native**, non convertis: le détail montre ce qui est sur chaque compte. Rejeté: tout convertir (perd l'information, ajoute un taux par ligne).
- **Soldes nuls exclus**: pas de contribution, bruit.
- **Ordre**: actifs d'abord (solde décroissant), puis découverts (plus négatif d'abord); égalité par nom.
- **Panneau CSS** (`group-hover` + `group-focus-within`, carte focusable) plutôt qu'une dépendance tooltip: aucun composant tooltip dans `ui/`, hover seul exclut clavier et toucher.
- Pas de schéma, pas de route.

## Kickoff

**Product**: plus petite tranche visible = liste en survol sur la carte existante. Hors périmètre: conversion par terme, clôturés. Débloque: rien de dépendant.
**Architect**: fonction pure dans `consolidated.ts` (registre: `computeConsolidatedBalance`, même module). `WealthCard` + `use-dashboard-data` + `dashboard-content`. Frame = 1 domaine + 3 UI: medium. Risque: somme des termes ≠ total (test d'invariant).
**Skeptic**: pin: compte clôturé, solde nul, solde manquant → ouverture, arrondi flottant, ordre, somme par devise = totaux natifs. Ne pas toucher `computeConsolidatedBalance`.
**Decisions**:
- Decision: fonction séparée because zéro régression; rejected champ ajouté à `ConsolidatedBalance`.
- Decision: panneau CSS focusable because clavier/toucher; rejected tooltip lib.
