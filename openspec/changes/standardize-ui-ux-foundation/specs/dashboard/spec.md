# Spec Delta

## MODIFIED Requirements

### Requirement: Sankey des flux du mois

L'UI du dashboard SHALL afficher le Sankey des flux du mois choisi, coloré par type (revenus, comptes, dépenses). En carte, les nœuds ne portent aucun libellé : le graphe se lit par survol. En plein écran, chaque nœud SHALL porter son nom et son montant agrégé.

#### Scenario: Flux avec données

- **GIVEN** des transactions, transferts et échéances payées sur le mois choisi
- **WHEN** le dashboard se charge
- **THEN** le Sankey s'affiche en carte sans libellé de nœud

#### Scenario: Carte sans texte illisible

- **GIVEN** le dashboard affiché sur un écran de 390 px
- **WHEN** la carte Sankey s'affiche
- **THEN** aucun nom de nœud ni montant n'est superposé dans la carte

#### Scenario: Plein écran avec libellés

- **WHEN** l'utilisateur ouvre le Sankey en plein écran
- **THEN** chaque nœud affiche son nom et son montant agrégé (ex. « Salaire · 3 000 € »)

#### Scenario: Mois sans données

- **GIVEN** aucune donnée sur le mois choisi
- **WHEN** le dashboard se charge
- **THEN** le Sankey affiche un état vide lisible, sans erreur

### Requirement: Donut des dépenses par catégorie

L'UI du dashboard SHALL afficher le donut des dépenses du mois choisi avec le total au centre de l'anneau. Aucun libellé ne SHALL être posé sur les segments, en carte comme en plein écran : la lecture se fait par survol et par une légende unique.

#### Scenario: Total au centre

- **GIVEN** 4 905 € de dépenses catégorisées sur le mois
- **WHEN** le donut s'affiche
- **THEN** « 4 905 € » (devise d'affichage courante) apparaît au centre de l'anneau

#### Scenario: Anneau sans texte

- **GIVEN** le donut affiché en carte ou en plein écran
- **WHEN** l'utilisateur ne survole aucun segment
- **THEN** aucun nom de catégorie ni pourcentage n'est posé sur l'anneau

#### Scenario: Plein écran

- **WHEN** l'utilisateur ouvre le donut en plein écran
- **THEN** une légende liste chaque catégorie avec son montant, et le survol d'un segment affiche sa catégorie et son pourcentage

#### Scenario: Répartition affichée

- **GIVEN** des dépenses catégorisées sur le mois
- **WHEN** le dashboard se charge
- **THEN** chaque catégorie occupe une part proportionnelle du donut, avec son montant lisible dans la légende
