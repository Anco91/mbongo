# transfer-management Specification (delta)

## ADDED Requirements

### Requirement: Pagination de la liste des transferts

La liste des transferts SHALL limiter l'affichage initial aux premiers transferts et proposer un bouton « afficher les autres » qui révèle le reste par paquets, adapté à la lecture mobile. Aucune suppression ni réordonnancement ne SHALL résulter de la pagination (liste triée par date, la plus récente d'abord).

#### Scenario: Quelques transferts

- **GIVEN** 2 transferts enregistrés
- **WHEN** la liste se charge
- **THEN** les 2 transferts sont affichés sans bouton « afficher les autres »

#### Scenario: Beaucoup de transferts

- **GIVEN** 12 transferts enregistrés
- **WHEN** la liste se charge
- **THEN** les premiers sont affichés et un bouton « afficher les autres » révèle les suivants par paquets
