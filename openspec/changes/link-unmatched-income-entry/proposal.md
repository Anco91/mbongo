## Why

L'écran « Revenus à lier » (spec 18) n'est joignable que par son URL. Un salaire arrivé hors du parcours « Confirmer » reste invisible : l'utilisateur ne sait pas qu'il doit le lier.

## What Changes

- Le tableau de bord affiche un bandeau « N revenus à lier » avec un lien vers `/incomes/unmatched`, seulement quand N > 0.
- Aucun changement de schéma, d'API ni de règle métier.

## Out of scope

- Entrée dans la barre d'onglets ou le budget mensuel.
- Pagination de l'écran (change `paginate-unmatched-income`).

## Capabilities

### Modified Capabilities
- `income-management`: ajout d'un point d'entrée vers « Revenus à lier ».
