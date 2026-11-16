# alerts Specification (delta)

## ADDED Requirements

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

L'UI du dashboard SHALL afficher les alertes actives dans un bandeau en tête de dashboard, triées par gravité (forte d'abord). Aucune alerte SHALL être émise pour une information non déclenchée.

#### Scenario: Bandeau vide

- **GIVEN** aucune condition d'alerte
- **THEN** aucun bandeau n'est affiché
