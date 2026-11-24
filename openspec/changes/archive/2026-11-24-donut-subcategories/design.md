## Decisions

- **Segment par catégorie, ventilation en champ optionnel** (décision 10a) : couleurs, part prévue, tri et test `m3-calculations` inchangés. Rejeté : un segment par sous-catégorie (casse couleurs et prévu).
- **« Autres » seulement si une sous-catégorie existe** dans le segment : sinon la légende ne change pas. La ventilation est calculée par segment (catégorie × prévu/réalisé), fusionnée à l'affichage.
- **Fusion en fonction pure** `mergeCategorySegments` (partagée, testée) : remplace `mergeLegendRows` local au composant.
- **Montants** : chaque ligne = `round2(eur + counterValue(chf, rate))`, comme le segment.
- Le donut de la carte n'a pas de légende : seul le plein écran change.

## Kickoff

**Product**: plus petite tranche visible = sous-lignes de légende plein écran.
**Architect**: calcul pur dans `donut.ts`, composant ne fait que rendre.
**Skeptic**: pins : sans sous-catégorie => pas de `subcategories` ; « Autres » ; CHF converti ; prévu+réalisé fusionnés ; tri décroissant ; segment inchangé.
**Decisions**: voir ci-dessus; aucun choix laissé à l'humain.
