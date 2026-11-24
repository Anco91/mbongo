# Spec Delta — dashboard

## MODIFIED Requirements

### Requirement: Sankey des flux du mois

L'UI du dashboard SHALL afficher le Sankey des flux du mois choisi, coloré par type (revenus, comptes, dépenses). Chaque nœud SHALL porter son nom ET son montant agrégé, en carte comme en plein écran — le graphe se lit sans survol. Les échéances à venir du mois choisi SHALL être représentées comme des flux « prévus », rendus distincts des flux réalisés, en plus des transactions réalisées du mois.

#### Scenario: Flux avec données

- **GIVEN** des transactions, transferts et échéances payées sur le mois choisi
- **WHEN** le dashboard se charge
- **THEN** chaque nœud affiche son nom et son montant (ex. « Salaire · 3 000 € »)

#### Scenario: Mois sans données

- **GIVEN** aucune donnée sur le mois choisi
- **WHEN** le dashboard se charge
- **THEN** le Sankey affiche un état vide lisible, sans erreur

#### Scenario: Mois préparé avec charges à venir

- **GIVEN** un mois préparé avec des échéances à venir et aucune dépense réalisée
- **WHEN** le dashboard se charge
- **THEN** le Sankey affiche la jambe comptes → charges comme flux prévu, distinct du réalisé

### Requirement: Donut des dépenses par catégorie

L'UI du dashboard SHALL afficher le donut des dépenses du mois choisi avec le total au centre de l'anneau. En plein écran, chaque segment SHALL porter son nom de catégorie ET son pourcentage posés sur le bandeau coloré, lisibles sans survol — pas de texte à côté du graphe (pas de légende séparée). Les échéances à venir du mois choisi SHALL compter dans les dépenses par catégorie comme part « prévue », rendue distincte du réalisé ; le total au centre SHALL être la somme du prévu et du réalisé.

#### Scenario: Total au centre

- **GIVEN** 4 905 € de dépenses catégorisées sur le mois
- **WHEN** le donut s'affiche
- **THEN** « 4 905 € » (devise d'affichage courante) apparaît au centre de l'anneau

#### Scenario: Plein écran

- **WHEN** l'utilisateur ouvre le donut en plein écran
- **THEN** chaque segment porte son nom de catégorie et son pourcentage dans l'anneau, sans survol ni légende séparée

#### Scenario: Répartition affichée

- **GIVEN** des dépenses catégorisées sur le mois
- **WHEN** le dashboard se charge
- **THEN** chaque catégorie occupe une part proportionnelle du donut avec son montant

#### Scenario: Donut d'un mois préparé sans paiement

- **GIVEN** un mois préparé avec des charges à venir et aucun paiement réalisé
- **WHEN** le donut s'affiche
- **THEN** les catégories des charges à venir occupent une part prévue distincte et le total au centre est non nul

### Requirement: Navigation mensuelle

Le dashboard SHALL permettre de consulter les mois passés et futurs : un curseur « ‹ mois › » dans la carte, et un swipe horizontal (geste tactile natif PWA) pour changer de mois. Sankey, donut, échéances, provisions et totaux du mois SHALL se recalculer pour le mois choisi ; le patrimoine consolidé et les alertes restent l'état du jour. Le curseur SHALL démarrer sur le mois courant. Les données du mois SHALL être requêtées pour le mois choisi (fenêtre sur la date d'échéance), sans dépendre d'un volume global tronqué ; les données préchargées côté serveur et les requêtes client SHALL utiliser la même requête du mois.

#### Scenario: Mois précédent

- **GIVEN** le dashboard sur le mois courant
- **WHEN** l'utilisateur touche « ‹ » ou swipe vers la droite
- **THEN** le mois précédent s'affiche avec ses flux et ses échéances

#### Scenario: Swipe

- **GIVEN** le dashboard ouvert sur mobile
- **WHEN** l'utilisateur swipe horizontalement sur la zone des charts
- **THEN** le mois change (avancer/reculer selon la direction)

#### Scenario: Mois au-delà des premières échéances globales

- **GIVEN** plus de 100 échéances dans la base, dont une partie hors du mois choisi
- **WHEN** le dashboard affiche un mois dont les échéances sont au-delà des 100 premières
- **THEN** les échéances, le Sankey et le donut de ce mois sont corrects
