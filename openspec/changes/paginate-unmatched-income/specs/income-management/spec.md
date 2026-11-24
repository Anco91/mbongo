## ADDED Requirements

### Requirement: Revenus à lier paginés

L'écran « Revenus à lier » SHALL lister toutes les entrées d'argent sans source, quel que soit leur nombre, par pages, et SHALL proposer « Afficher plus » tant qu'une page suivante existe.

#### Scenario: Plus d'une page

- **GIVEN** plus d'entrées sans source que la taille d'une page
- **WHEN** l'utilisateur clique sur « Afficher plus »
- **THEN** la page suivante s'ajoute sans recharger l'écran

#### Scenario: Entrée ancienne

- **GIVEN** une entrée sans source plus ancienne que 500 transactions
- **WHEN** l'utilisateur ouvre l'écran et affiche toutes les pages
- **THEN** l'entrée est listée

#### Scenario: Dernière page

- **WHEN** il n'y a plus de page suivante
- **THEN** « Afficher plus » n'est pas affiché
