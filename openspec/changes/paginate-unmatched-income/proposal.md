## Why

L'écran « Revenus à lier » charge une seule page de 500 transactions (toutes, entrées et sorties). Au-delà, les entrées anciennes sans source ne sont jamais listées : un salaire oublié peut rester invisible.

## What Changes

- La requête filtre côté serveur sur les entrées sans source (`amount > 0`, `incomeId` nul, `transferId` nul) pour que la limite ne compte que des candidats.
- L'écran charge par pages (curseur existant) avec un bouton « Afficher plus » tant qu'il reste une page.
- Aucun changement de schéma ni de règle métier.

## Out of scope

- Entrée depuis le tableau de bord (change `link-unmatched-income-entry`).
- Dissociation, choix d'un autre mois.

## Capabilities

### Modified Capabilities
- `income-management`: « Revenus à lier » liste toutes les entrées sans source, par pages.
