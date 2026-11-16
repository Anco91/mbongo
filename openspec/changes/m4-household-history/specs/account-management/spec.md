# account-management Specification (delta)

## ADDED Requirements

### Requirement: Pagination de la liste des comptes

La liste des comptes SHALL limiter l'affichage initial aux 3 premiers comptes et proposer « afficher les autres » qui révèle le reste par paquets de 5 (geste mobile natif, pas une barre de pages web). Le filtre par membre et la navigation vers l'édition SHALL rester inchangés ; la pagination ne SHALL ni supprimer ni réordonner d'éléments.

#### Scenario: Quelques comptes

- **GIVEN** 2 comptes actifs
- **WHEN** la liste se charge
- **THEN** les 2 comptes sont affichés sans bouton « afficher les autres »

#### Scenario: Beaucoup de comptes

- **GIVEN** 6 comptes actifs
- **WHEN** la liste se charge
- **THEN** 3 comptes sont visibles et « afficher les autres » révèle les 3 suivants
