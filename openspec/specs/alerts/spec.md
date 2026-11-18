# alerts Specification

## Purpose

TBD - created from delta of change m3-maquette-refactor-features.

## Requirements

### Requirement: Alerte échéance proche

Le système SHALL émettre une alerte pour toute échéance non payée dont la date est dans les 7 prochains jours (0 < jours restants ≤ 7). L'alerte SHALL être émise le jour même de l'échéance également.

#### Scenario: Échéance dans 3 jours

- **GIVEN** une échéance PENDING à J+3
- **WHEN** les alertes sont calculées
- **THEN** une alerte « échéance proche » est présente avec le libellé de la charge et le montant

#### Scenario: Échéance au-delà de 7 jours

- **GIVEN** une échéance PENDING à J+10
- **WHEN** les alertes sont calculées
- **THEN** aucune alerte pour cette échéance

### Requirement: Alerte découvert autorisé

Pour tout compte avec découvert autorisé (montant > 0), le système SHALL émettre une alerte simple quand le solde approche de la limite du découvert (provisionnel inclus) et une alerte forte au dépassement.

#### Scenario: Approche du découvert

- **GIVEN** un compte avec 500 EUR de découvert et un solde provisionnel à -430 EUR
- **WHEN** les alertes sont calculées
- **THEN** une alerte simple « approche du découvert » est présente

#### Scenario: Découvert dépassé

- **GIVEN** le solde provisionnel descend sous -(découvert autorisé)
- **THEN** une alerte forte « découvert dépassé » est présente

### Requirement: Alerte trésorerie prévisionnelle négative

Le système SHALL émettre une alerte quand la trésorerie prévisionnelle d'un compte (solde actuel + échéances + provisions à venir sur l'horizon proche) devient négative, découvert non autorisé ou dépassé.

#### Scenario: Prévisionnel négatif

- **GIVEN** un compte sans découvert dont le solde provisionnel devient négatif à une date future
- **WHEN** les alertes sont calculées
- **THEN** une alerte « trésorerie négative » indique la date et le montant

### Requirement: Présentation des alertes

L'UI SHALL présenter les alertes via une icône cloche dans le header, accompagnée d'un badge du nombre d'alertes actives non lues. La consultation se fait dans une vue dédiée listant toutes les alertes actives triées par gravité (forte d'abord). Le dashboard SHALL rester épuré : aucune alerte ne SHALL y être affichée en bandeau. Aucune alerte SHALL être émise pour une information non déclenchée.

#### Scenario: Accès aux alertes

- **GIVEN** 3 alertes actives non lues
- **WHEN** l'utilisateur touche la cloche du header
- **THEN** la vue dédiée affiche les 3 alertes triées par gravité

#### Scenario: Bandeau vide

- **GIVEN** aucune condition d'alerte
- **THEN** le badge de la cloche n'est pas affiché et la vue dédiée montre un état vide lisible

### Requirement: État lu des alertes

Chaque alerte SHALL être marquée comme lue quand l'utilisateur la consulte (vue dédiée ouverte) ou la rejette explicitement. L'état lu SHALL être conservé par appareil et Shall faire disparaître le badge quand toutes les alertes actives sont lues. Une alerte dont la condition se déclenche à nouveau SHALL réapparaître comme non lue.

#### Scenario: Badge décrémenté

- **GIVEN** 3 alertes actives non lues
- **WHEN** l'utilisateur ouvre la vue dédiée
- **THEN** le badge disparaît (alertes marquées lues) tant que les conditions ne se redéclenchent pas

#### Scenario: Redéclenchement

- **GIVEN** une alerte lue
- **WHEN** sa condition se déclenche à nouveau (nouvelle échéance proche, nouveau dépassement)
- **THEN** le badge réapparaît avec cette alerte comptée comme non lue
