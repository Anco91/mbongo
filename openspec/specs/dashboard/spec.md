# dashboard Specification

## Purpose

TBD - created from delta of change m3-maquette-refactor-features.

## Requirements

### Requirement: Page d'accueil

L'application SHALL servir le dashboard sur la route racine `/`. Aucune autre page SHALL être l'accueil par défaut.

#### Scenario: Accès racine

- **WHEN** l'utilisateur ouvre `/`
- **THEN** le dashboard s'affiche sans redirection ni 404

### Requirement: Patrimoine consolidé

L'UI du dashboard SHALL afficher, pour le mois courant : le total consolidé en EUR au taux de conversion courant, toujours accompagné de la date du taux (« au taux du JJ/MM/AAAA »), ainsi que le total CHF natif affiché en parallèle. Les soldes des comptes individuels SHALL rester accessibles sur la vue comptes, pas dans le résumé consolidé.

#### Scenario: Consolidation datée

- **GIVEN** un taux de conversion EUR/CHF existant à une date t
- **WHEN** le dashboard se charge
- **THEN** le total consolidé EUR est affiché avec la mention de la date du taux
- **AND** le total CHF est affiché en parallèle

#### Scenario: Aucun taux

- **GIVEN** aucun taux saisi
- **WHEN** le dashboard se charge
- **THEN** le total consolidé EUR n'est pas affiché (ou indiqué indisponible), sans erreur

### Requirement: Sankey des flux du mois

L'UI du dashboard SHALL afficher le diagramme de Sankey des flux du mois : revenus (transactions d'entrée) → comptes → catégories de charges/épargne, agrégé depuis les transactions et transferts du mois. Le Sankey SHALL être consultable en plein écran avec zoom et déplacement.

#### Scenario: Flux avec données

- **GIVEN** des transactions, transferts et échéances payées sur le mois
- **WHEN** le dashboard se charge
- **THEN** le Sankey montre des nœuds revenus/comptes/dépenses avec des flux proportionnels

#### Scenario: Mois sans données

- **GIVEN** aucune donnée sur le mois
- **WHEN** le dashboard se charge
- **THEN** le Sankey est vide ou affiche un état « aucune donnée », sans erreur

### Requirement: Donut des dépenses par catégorie

L'UI du dashboard SHALL afficher un donut des dépenses du mois par catégorie, complémentaire du Sankey, avec les montants par catégorie listés à côté. Consultable en plein écran.

#### Scenario: Répartition affichée

- **GIVEN** des dépenses catégorisées sur le mois
- **WHEN** le dashboard se charge
- **THEN** chaque catégorie occupe une part proportionnelle du donut avec son montant

### Requirement: Échéances du mois

L'UI du dashboard SHALL afficher la liste des échéances du mois (due date, montant, devise, compte débité, statut), limitée aux premières avec bouton « afficher les autres ». Chaque élément s'ouvre en feuille de détail.

#### Scenario: Liste tronquée

- **GIVEN** plus de 3 échéances au mois
- **THEN** les premières sont affichées et un bouton révèle les suivantes
