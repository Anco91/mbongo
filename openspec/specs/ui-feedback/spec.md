# ui-feedback Specification

## Purpose

Définir les états transitoires de l'interface — chargement, erreur et reprise — et garantir un rendu identique et en français sur toutes les vues.

## Requirements

### Requirement: États de chargement et d'erreur cohérents

Toutes les vues SHALL présenter le chargement et l'échec de récupération de données avec les mêmes primitives visuelles : un état de chargement sobre, puis, en cas d'échec, un panneau d'erreur portant le message et une action de reprise. Aucune vue ne SHALL afficher un écran blanc ou un message brut non traduit.

#### Scenario: Chargement d'une liste

- **GIVEN** une vue liste dont les données arrivent
- **WHEN** la requête est en cours
- **THEN** un indicateur de chargement est affiché, identique à celui des autres listes

#### Scenario: Échec avec reprise

- **GIVEN** une vue dont la requête échoue
- **WHEN** le panneau d'erreur s'affiche
- **THEN** le message est en français et un bouton « Réessayer » relance la requête

### Requirement: Frontières d'erreur par segment

Chaque segment de route principal (dashboard, charges, transferts, comptes, échéancier, alertes, foyer) SHALL posséder une frontière d'erreur qui capture un rendu en échec et propose une reprise, sans casser la coque (en-tête et barre d'onglets restent utilisables).

#### Scenario: Rendu en échec

- **GIVEN** un composant de vue qui lève une erreur de rendu
- **WHEN** la page s'affiche
- **THEN** la coque reste en place et le segment affiche un message d'erreur avec une action de reprise

### Requirement: Langue de l'interface

L'interface SHALL être intégralement en français : le document déclare `lang="fr"` et les libellés visibles (chargement, erreur, reprise, titres, actions vides) ne mélangent pas anglais et français.

#### Scenario: Document et libellés

- **GIVEN** n'importe quelle vue
- **WHEN** la page est rendue
- **THEN** `lang="fr"` est déclaré et tous les libellés visibles sont en français
