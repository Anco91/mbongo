# charge-management Specification (delta)

## ADDED Requirements

### Requirement: Pagination de la liste des charges

La liste des charges SHALL limiter l'affichage initial aux 3 premières charges et proposer « afficher les autres » qui révèle le reste par paquets de 5 (geste mobile natif, pas une barre de pages web). Les filtres (membre, type) SHALL s'appliquer avant la pagination ; changer de filtre SHALL réinitialiser la pagination au début de la liste filtrée.

#### Scenario: Quelques charges

- **GIVEN** 3 charges filtrées
- **WHEN** la liste se charge
- **THEN** les 3 charges sont affichées sans bouton « afficher les autres »

#### Scenario: Beaucoup de charges

- **GIVEN** 10 charges après filtres
- **WHEN** la liste se charge
- **THEN** 3 charges sont visibles et « afficher les autres » révèle le reste par paquets de 5
