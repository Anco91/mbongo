## Why

10a a ajouté la sous-catégorie sur les charges, mais le donut n'en montre rien : « Abonnements 120 € » ne dit pas ce qui coûte (mobile, internet, sport).

## What Changes

- `computeDonutExpenses` garde un segment par catégorie (couleurs et part prévue intactes) et ajoute à chaque segment une ventilation optionnelle `subcategories` (nom, montant consolidé EUR).
- Les dépenses d'une catégorie sans sous-catégorie (charge sans sous-catégorie, transaction) comptent dans une ligne « Autres », seulement quand au moins une sous-catégorie est renseignée dans le segment.
- La légende plein écran affiche, sous chaque catégorie, ses sous-catégories avec leur montant. Prévu et réalisé fusionnent comme pour la catégorie.
- Aucun changement de la carte (pas de légende) ni du Sankey.

## Out of scope

- Sous-catégorie des transactions, anneau à deux niveaux, Sankey.
- Tests d'UI (glue).

## Capabilities

### Modified Capabilities
- `dashboard`: le donut expose la ventilation par sous-catégorie en légende plein écran.
